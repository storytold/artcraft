use speculoos::asserting;

use prompt_engineering::classify_prompt::classify_prompt;

#[test]
fn english_nsfw_prompts_test() {
  assert_prompts_are_nsfw(&[
    "((san from princess mononoke)), ((having sex)), (cowgirl position), ((penis in vagina)), ((short ginger hair)), (crop top),(lifting top), (showing tits), (nipples), ((small breast)), ((muscular)), hotelroom, ((drunk:1.2)), ((no panties)), (kneeling over a man), (((gaping pussy))),  ((skirt)), horny, (in heat), (furrowed brow), (angry expression), ((sweat:1.2)), absurd resolution, masterpiece, ultra-detailed, vivid, intricate details, (((photorealistic))), visceral experience, (dynamic angle), (sharp focus), perfect face, looking down, perfect nipples, perfect feet",
    "1girl, nude, large breasts",
    "2B. white swimsuit, butt, black eyeliner, white droplets on ass, sunscreen bottle in hand",
    "3 naked Latina women in a swimming pool",
    "A beautiful, young, curvy woman with ginger hair, huge breasts twice the size of her head, wearing (red glasses) and a (((sexy white nurse costume with a front red zip))), playfully flirting with the viewer; ((pulling on the front zip, showing off her cleavage)), (no background; solid colour background). Mind-broken; sexual ecstasy, ahegao, happy, (Horny, naughty face), ((cock hungry, cock worship, penis awe)), 3/4 head shot; head, hair and arms in frame",
    "a gay black guy with nipples and has undies on",
    "A giant woman living in a city she loves putting people in her butthole",
    "A girl who used her ass to eat vore",
    "a poop dressed as a princess",
    "A pornstar getting semen on her face stylized in 4k, realism, high resolution and NSFW.",
    "A realistic photo of pokemon fully nude",
    "A sexy anime girl with no clothes or bra and full body",
    "A sexy anime girl with no clothes or bra",
    "a woman having sex with a man",
    "Adult film star Lisa Ann, naked, posing for viewer <lora:winking_v1:1>",
    "ahh daddy ahh fuck me",
    "Anal vore",
    "Anime Girl (NSFW)",
    "anime girl getting fucked in the pussy",
    "Anime girl moaning cum naked",
    "anime girl naked moaning lots of cum",
    "anime girl pussy getting fucked",
    "Anime girls squiring from thier vaginas",
    "anime pussy getting fucked by a dick",
    "Anime woman jerking a man off",
    "Anime woman showing her boobs",
    "Anime woman with penis between her boobs and cum on her boobs",
    "anthropomorphic poop princess in a castle bedroom",
    "Belle Delphine's pussy squirting",
    "Big boobs having sex ",
    "Big boobs",
    "Big breast",
    "Big naked but girl with huge eyes on each cheek",
    "Big nude boobs",
    "Big perfect white boobs",
    "Bikini girls tanning naked at the beach",
    "black women, cum inflation, cute, sex, big boobs, big ass",
    "Blowjob and cum",
    "COCK COCK AND DICK BALLS HEELLPPPP",
    "Creampie (NSFW)",
    "Cute, is a latina, and naked",
    "dick pic",
    "Full body naked big boobs open pussy moaning anime girl",
    "Full body, ultra giant boobs, ultra thicc, naked, facing viewer, in the sewers",
    "Futanari holding her penis in one hand",
    "Futanari",
    "Generate a beautiful picture of a naked woman.",
    "girl getting fucked in a pussy and another girl showing her ass in the image",
    "girl in a tight thong. NSFW, k, realistic, photorealsitic.",
    "Girl naked, masturbating, ahegao, squatting",
    "Girl naked, masturbating, ahegao, squatting, ultra realistic",
    "Girl nude, pink hair, pink pussy ",
    "Girl with big ass in white pants shake her ass",
    "Girl with big ass sits on chair on tight skirt",
    "Girl with big boobs and small bro touch her boobs and make a lusty eye contact",
    "girls gaping pussy and ass close up in the camera",
    "guy shitting in the toilet",
    "hentai",
    "Hitomi Tanaka with nude big boobs and pussy open",
    "hot and pretty faced naked girls",
    "hot anime girl gaping pussy and ass legs wide open",
    "hot cat girl pussy getting fucked by a dick",
    "hot gaping pussy and ass close up",
    "hot gaping pussy and ass legs wide open",
    "hot girl gaping pussy and ass close up in the camera",
    "hot girl with a tight vagina",
    "Hot girl with big boobs in white dress",
    "hot hentai fuck",
    "Hot naked anime maids",
    "hot naked girl full body",
    "hot naked girl",
    "hot wet gaping pussy close up",
    "hot white girl gaping pussy and ass close up in the camera",
    "Hottest anime girl spreading apart her vagina",
    "Huge breasts naked anime girl",
    "HUGEEEEEEEE BOOBS, HUGEEEEEEEEEEEE BUTT, a latina, has white hair, OVERLY CUTE, NAKED",
    "huniepop 3",
    "Huniepop fairy in pink lingerie",
    "Huniepop",
    "hyper boobs, boobjob, cum, smaller male, black girl, white man, paizuri, sex, black female, inflation, expansion, cum inflation, dialouge",
    "hyper boobs, boobjob, cum, smaller male, black girl, white man, paizuri, sex,",
    "inflation, water inflation, oral, hose in mouth, water, orgasm, english dialouge, solo female, belly expansion, expansion, cum, inflation, water inflation, water inflation, water inflation, water inflation, human girl, orgasm, human girl inflation",
    "intercource between man and women",
    "Iran blowjob girl",
    "Iranian girl suck dick",
    "juicy wet pussy close up",
    "Kyu Sugardust from the game Huniepop",
    "leaked sex tape",
    "Lesbians in a park nude",
    "LOOK AT MY MASSIVE DICK",
    "Man and woman having sex",
    "Man cumming on a woman’s ass",
    "Mikasa Blowjob in car with big ass",
    "Mikasa with big boobs",
    "minecraft creeper having sex in the pussy with another minecraft creeper",
    "moaning anime girl",
    "monkey standing up with huge black penis hanging down",
    "monkey with a huge black penis",
    "naked anime girl",
    "Naked Gardevoir",
    "Naked girl showing her creampied vagina",
    "Naked girl showing her cum covered vagina ",
    "Naked girl showing her cum covered vagina",
    "naked girl sitting in chair",
    "Naked girl spreading her pussy",
    "Naked woman giving birth",
    "Naked woman",
    "naked women fingring",
    "naked",
    "Naked, cute, hot, nice boobs",
    "Nude woman big boobs",
    "Nude woman sucking dick",
    "Nude woman",
    "nutsack",
    "Penis",
    "porno",
    "pov your having sex with a naked anime girl",
    "Purple haired, big breasted, naked, purple eyes, blushing",
    "Purple haired, big breasted, naked, purple eyes, blushing, embarrassed, full body",
    "Purple haired, naked, woman, naked, big breasts, blushing",
    "pussy",
    "raven team leader from fortnite getting fucked in the pussy",
    "Santa jerking his penis in his workshop",
    "Santa wanking his meat in his workshop",
    "sex",
    "Sexy milf with big ass sits on big dick anal",
    "Sexy woman, ultra giant boobs, ultra thicc, facing viewer, standing, arms behind back, naked, in the mall",
    "sexy,high heels,long brown hair,big breast,KTV,seducing",
    "short blonde hair , side shaved. nude, legs spread, black eyeshadow, red lipstick, full body, sexy. realistic. 1970's",
    "short blonde hair side shaved, black lingerie, black eyeliner, cum on face",
    "The Love Fairy Kyu Sugardust from the game Huniepop",
    "The wettest vagina ",
    "The wettest vagina",
    "titfuck, huge boobs",
    "Vagina cuming",
    "Vagina hole",
    "Vagina squirting",
    "vagina",
    "Vegeta female version with big boobs from Dragonball",
    "Wet vagina after cream pie",
    "Wet vagina after cream pie\n",
    "woman pleasuring herself stylized in photorealist, 4k, high-res, and NSFW (Nude)",
    "woman sucking dick.",
    "Woman with huge tits desnude",
    "Woman with huge tits",
    "Women with boobs too big for her own good",
    "yuki tsukumo woman face feet five toes anime two feet normal sized feet tall body two legs 5,9 watery substance on feet feet in air sitting by bed blonde,long hair,grinning no clothes 35 year old big boobs long toes legs up in the air inviting to pussy two legs up in the air exposed nipples and breasts dripping wet pussy black tanktop blue jeans lipstick holding legs in the air moaning\n\nshowing her soles to the camera",
    "Zayne and Nicky gay sex",
  ]);
}

#[test]
fn spanish_nsfw_prompts_test() {
  assert_prompts_are_nsfw(&[
    "Girl desnude",
    "Mujer rubia de ojos celestes y senos grandes en traje de baño rojo caminando por una playa del caribe",
    "Mujer rubia desnuda tomando sol en la ppaya",
  ]);
}

fn assert_prompts_are_nsfw(prompts: &[&str]) {
  for prompt in prompts {
    let classification = classify_prompt(prompt);

    asserting(&format!("is nsfw - prompt: {}", prompt))
        .that(&classification.prompt_references_sex)
        .is_equal_to(true);

    asserting(&format!("references children - prompt: {}", prompt))
        .that(&classification.prompt_references_children)
        .is_equal_to(false);

    asserting(&format!("is abusive - prompt: {}", prompt))
        .that(&classification.is_abusive())
        .is_equal_to(false);

    asserting(&format!("is child abuse - prompt: {}", prompt))
        .that(&classification.is_child_abuse())
        .is_equal_to(false);
  }
}
