use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct TranslateRequestItem {
    #[serde(rename = "Text")]
    text: String,
}

#[derive(Deserialize)]
struct TranslateResponseItem {
    translations: Vec<TranslateTranslation>,
}

#[derive(Deserialize)]
struct TranslateTranslation {
    text: String,
}

#[tauri::command]
pub async fn translate_text(
    text: String,
    api_key: String,
    region: String,
    from: String,
    to_list: Vec<String>,
) -> Result<String, String> {
    let to = to_list.join("&to=");
    let url = format!(
        "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from={}&to={}&textType=html",
        from, to
    );

    let body = vec![TranslateRequestItem { text }];

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Ocp-Apim-Subscription-Key", &api_key)
        .header("Ocp-Apim-Subscription-Region", &region)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("翻译请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("翻译 API 错误 ({}): {}", status, body));
    }

    let result: Vec<TranslateResponseItem> = response
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
