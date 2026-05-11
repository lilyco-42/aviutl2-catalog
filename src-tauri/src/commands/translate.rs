use serde::Deserialize;

const FREE_ENDPOINT: &str = "https://translate.googleapis.com/translate_a/single";

/// Google Translate response: [[["trans","orig",...],...],,"src"]
type GResponse = Vec<GResponseItem>;
type GResponseItem = serde_json::Value;

fn strip_html(html: &str) -> String {
    let mut out = String::with_capacity(html.len());
    let mut in_tag = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(ch),
            _ => {}
        }
    }
    out
}

fn extract_translation(json: &str) -> Result<String, String> {
    let parsed: GResponse = serde_json::from_str(json).map_err(|e| format!("解析响应失败: {}", e))?;
    let mut result = String::new();
    for item in &parsed {
        if let Some(arr) = item.as_array() {
            for segment in arr {
                if let Some(inner) = segment.as_array()
                    && let Some(trans) = inner.first()
                    && let Some(text) = trans.as_str()
                {
                    result.push_str(text);
                }
            }
        }
    }
    if result.is_empty() {
        return Err("翻译结果为空".to_string());
    }
    Ok(result)
}

async fn translate_chunk(client: &reqwest::Client, text: &str, from: &str, to: &str) -> Result<String, String> {
    let url = format!(
        "{}?client=gtx&sl={}&tl={}&dt=t&q={}",
        FREE_ENDPOINT,
        from,
        to,
        urlencoding(&text)
    );

    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    let body = response.text().await.map_err(|e| format!("读取响应失败: {}", e))?;
    extract_translation(&body)
}

fn urlencoding(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 3);
    for byte in s.as_bytes() {
        match *byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(*byte as char),
            b' ' => out.push('+'),
            _ => {
                out.push('%');
                out.push(HEX[(*byte >> 4) as usize] as char);
                out.push(HEX[(*byte & 0x0f) as usize] as char);
            }
        }
    }
    out
}

const HEX: &[u8] = b"0123456789ABCDEF";

const MAX_CHUNK_LEN: usize = 4000;

fn split_text(text: &str) -> Vec<String> {
    if text.len() <= MAX_CHUNK_LEN {
        return vec![text.to_string()];
    }

    let mut chunks = Vec::new();
    let mut start = 0;
    while start < text.len() {
        let end = (start + MAX_CHUNK_LEN).min(text.len());
        if end >= text.len() {
            chunks.push(text[start..].to_string());
            break;
        }
        let slice = &text[start..end];
        if let Some(pos) = slice.rfind("\n\n") {
            chunks.push(text[start..start + pos].to_string());
            start += pos + 2;
        } else if let Some(pos) = slice.rfind('\n') {
            chunks.push(text[start..start + pos].to_string());
            start += pos + 1;
        } else if let Some(pos) = slice.rfind(". ") {
            chunks.push(text[start..start + pos + 1].to_string());
            start += pos + 2;
        } else {
            chunks.push(slice.to_string());
            start = end;
        }
    }
    chunks
}

#[tauri::command]
pub async fn translate_text(
    text: String,
    api_key: String,
    region: String,
    from: String,
    to_list: Vec<String>,
) -> Result<String, String> {
    let to = to_list.first().map(|s| s.as_str()).unwrap_or("zh-CN");

    // Use Microsoft Translator if API key is provided
    if !api_key.trim().is_empty() {
        return translate_via_azure(&text, &api_key, &region, &from, to).await;
    }

    // Fall back to Google Translate free endpoint
    let plain = strip_html(&text);
    if plain.trim().is_empty() {
        return Ok(text);
    }

    let client = reqwest::Client::new();
    let chunks = split_text(&plain);

    if chunks.len() == 1 {
        return translate_chunk(&client, &chunks[0], &from, to).await;
    }

    let mut results = Vec::new();
    for chunk in &chunks {
        let translated = translate_chunk(&client, chunk, &from, to).await?;
        results.push(translated);
    }
    Ok(results.join("\n\n"))
}

async fn translate_via_azure(
    text: &str,
    api_key: &str,
    region: &str,
    from: &str,
    to: &str,
) -> Result<String, String> {
    #[derive(serde::Serialize)]
    struct ReqItem {
        #[serde(rename = "Text")]
        text: String,
    }

    #[derive(Deserialize)]
    struct RespItem {
        translations: Vec<RespTranslation>,
    }

    #[derive(Deserialize)]
    struct RespTranslation {
        text: String,
    }

    let url = format!(
        "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from={}&to={}&textType=html",
        from, to
    );

    let body = vec![ReqItem { text: text.to_string() }];

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Ocp-Apim-Subscription-Key", api_key)
        .header("Ocp-Apim-Subscription-Region", region)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Azure 翻译请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Azure 翻译 API 错误 ({}): {}", status, body));
    }

    let result: Vec<RespItem> = response
        .json()
        .await
        .map_err(|e| format!("翻译响应解析失败: {}", e))?;

    result
        .into_iter()
        .flat_map(|item| item.translations.into_iter().map(|t| t.text))
        .collect::<Vec<_>>()
        .first()
        .cloned()
        .ok_or_else(|| "翻译结果为空".to_string())
}
