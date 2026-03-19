//! Tests that could be close to CSAM, but appear to be completely SFW

use speculoos::asserting;

use prompt_engineering::classify_prompt::classify_prompt;

#[test]
fn borderline_cases() {
  // These are actual user prompts that use borderline language, but are safe
  assert_prompts_are_sfw(&[
    "1 girl，pretty face,white stocking,swimmingsuit,duck sitting，school",
    "4 year old girl, wearing a headset microphone",
    "6 year old girl",
    "a girl wearing a frost free puffer vest while sleeping with her mouth open",
    "child's drawing of a fox",
    "Create an Korean child playing with a polish child on play ground",
    "Demon boy teen that is cute hot in a black suit and tie",
    "girl in a strapless dress in a feald of flower",
    "navel of a girl is eating banana",
    "two girls kissing in bed",
  ]);
}

fn assert_prompts_are_sfw(prompts: &[&str]) {
  for prompt in prompts {
    let classification = classify_prompt(prompt);

    asserting(&format!("is abusive - prompt: {}", prompt))
        .that(&classification.is_abusive())
        .is_equal_to(false);

    asserting(&format!("is child abuse - prompt: {}", prompt))
        .that(&classification.is_child_abuse())
        .is_equal_to(false);

    asserting(&format!("references children or potential minors - prompt: {}", prompt))
        .that(&(classification.prompt_references_children || classification.prompt_references_potential_minors))

        .is_equal_to(true);
  }
}
