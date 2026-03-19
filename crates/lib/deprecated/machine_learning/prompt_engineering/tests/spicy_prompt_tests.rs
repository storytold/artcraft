//! "Spicy" prompts are not necessarily NSFW
//! Currently these get the "NSFW" treatment, but we may wish to engineer the negative prompt
//! to steer the image generation away from NSFW territory.
//!
use speculoos::asserting;

use prompt_engineering::classify_prompt::classify_prompt;

#[test]
fn permissible_sexy_tests() {
  // These classify as NSFW now, but should be in a category of their own
  assert_prompts_are_spicy(&[
    "(masterpiece), best quality, expressive eyes, perfect face, 1girl, anime, plump, solo, headphones, blonde hair, breasts, swimsuit, twintails, bikini, huge breasts, orange eyes, white bikini, short hair, blush, navel, smile, open mouth, looking at viewer, cleavage, barefoot, standing, render, full body, <lora:tachie:0.7>, massive belly, roundybelly, pregnant belly, <lora:BGV5EX:0.7>, animated",
    "Beautiful woman, seductive pose, full body visible, leotard, heels",
    "sexy,seducing,long hair,high heels,KTV,stockings",
    "short blonde hair , side shaved. bunnygirl, corset, bunny ears, black eyeshadow, red lipstick, full body, sexy. realistic. ",
    "short green and black hair , side shaved, black lingerie, black eyeshadow, dark lipstick, full body, smirk",
  ]);
}

fn assert_prompts_are_spicy(prompts: &[&str]) {
  for prompt in prompts {
    let classification = classify_prompt(prompt);

    asserting(&format!("is abusive - prompt: {}", prompt))
        .that(&classification.is_abusive())
        .is_equal_to(false);

    asserting(&format!("is child abuse - prompt: {}", prompt))
        .that(&classification.is_child_abuse())
        .is_equal_to(false);

    // TODO: This test should be made to report `false`
    //asserting(&format!("is nsfw - prompt: {}", prompt))
    //    .that(&classification.prompt_references_sex)
    //    .is_equal_to(true);
  }
}
