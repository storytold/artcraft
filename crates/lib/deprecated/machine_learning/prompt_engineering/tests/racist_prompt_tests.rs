use speculoos::asserting;

use prompt_engineering::classify_prompt::classify_prompt;

#[test]
fn test_bad_user_racist_prompts() {
  assert_prompts_are_racism(&[
    "adolf hitler having tea with joe biden",
    "niggers",
  ]);
}

fn assert_prompts_are_racism(prompts: &[&str]) {
  for prompt in prompts {
    let classification = classify_prompt(prompt);

    asserting(&format!("is abusive - prompt: {}", prompt))
        .that(&classification.is_abusive())
        .is_equal_to(true);

    asserting(&format!("is racism - prompt: {}", prompt))
        .that(&classification.prompt_references_racism)
        .is_equal_to(true);
  }
}
