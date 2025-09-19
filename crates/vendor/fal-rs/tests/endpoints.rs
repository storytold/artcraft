#[tokio::test]
async fn test_fal_ai_flux_dev() {
    let response = fal::endpoints::fal_ai::flux::dev::dev(
        fal::endpoints::fal_ai::flux::dev::DevTextToImageInput {
            prompt: "a horse".to_string(),
            ..Default::default()
        },
    )
    .send()
    .await
    .unwrap();

    assert!(response.images.len() > 0);
}
