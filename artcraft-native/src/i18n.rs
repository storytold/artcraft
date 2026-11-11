//! Internationalization (i18n): English is the source language; العربية (Arabic) is a
//! runtime translation selected from the UI. The dictionary maps every English UI string the
//! app shows to its Arabic counterpart; unknown strings fall back to English, so anything
//! not yet translated keeps working.
//!
//! Usage: `crate::i18n::t("Sign in")` at display time, and
//! `tf("Signed in as @{}", &[user])` for patterns with `{}` placeholders.
//! `set_language`/`language` drive the language state (persisted in `Saved`), and//!
//! egui lays a label's runs left to right and runs no bidi over them, so Arabic's
//! translations are handed out in visual order (`bidi.rs`): the runs in the order a
//! right-to-left reader meets them, the letters inside each run in logical order for the
//! shaper, brackets mirrored. What a user types keeps its logical order.

mod bidi;

use std::sync::OnceLock;
use std::sync::atomic::{AtomicU8, Ordering};

/// The UI language. English is the source language; العربية (Arabic) is right-to-left.
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Language {
  #[default]
  English,
  Arabic,
}

impl Language {
  /// BCP 47 code, e.g. `"en"`, `"ar"`.
  pub fn code(self) -> &'static str {
    match self {
      Self::English => "en",
      Self::Arabic => "ar",
    }
  }

  /// The language's own name, shown in the language picker.
  pub fn name(self) -> &'static str {
    match self {
      Self::English => "English",
      Self::Arabic => "العربية",
    }
  }

  /// Parse a BCP 47 code (case-insensitive; unknown codes are English). Any `ar-XX`
  /// region (ar-SA, ar-EG …) resolves to Arabic, like the other Craft apps.
  pub fn from_code(code: &str) -> Self {
    let code = code.replace('_', "-");
    let code = code.as_str();
    if code.eq_ignore_ascii_case("ar") || code.to_ascii_lowercase().starts_with("ar-") { Self::Arabic } else { Self::English }
  }

  /// Every language, in display order.
  pub const ALL: &'static [Language] = &[Language::English, Language::Arabic];
}

/// The active language, mirrored into a global so every `t()` call is cheap.
static LANGUAGE: AtomicU8 = AtomicU8::new(Language::English as u8);

/// Set the active language (from the UI when it changes, and on load).
pub fn set_language(l: Language) {
  LANGUAGE.store(l as u8, Ordering::Relaxed);
}

/// The active language.
pub fn language() -> Language {
  match LANGUAGE.load(Ordering::Relaxed) {
    1 => Language::Arabic,
    _ => Language::English,
  }
}

/// Is the UI in Arabic (right-to-left)?
pub fn is_arabic() -> bool {
  language() == Language::Arabic
}

/// Translate an English UI string into the active language. Unknown strings (and English)
/// come back unchanged, so untranslated additions keep working.
pub fn t(s: &str) -> String {
  if !is_arabic() {
    return s.to_string();
  }
  match tr_ar_index(s) {
    // Arabic's translations come back in visual order (bidi.rs): the runs in the order
    // egui draws them, left to right, so the label reads right to left.
    Some(i) => visual_ar()[i].clone(),
    None => s.to_string(),
  }
}

/// Translate a pattern with positional placeholders, substituting the arguments in order.
/// A placeholder is `{}` or a bare format spec such as `{:.1}` (the argument is expected
/// to be pre-formatted); the translated pattern keeps its placeholders, so word order is
/// free.
pub fn tf(pattern: &str, args: &[String]) -> String {
  if !is_arabic() {
    return fill(pattern, args);
  }
  match tr_ar_index(pattern) {
    // The pattern is filled in logical order and reordered afterwards (bidi.rs), so two
    // placeholders cannot land in each other's places and a number keeps its reading spot.
    Some(i) => bidi::visual_rtl(&fill(AR[i].1, args)),
    None => fill(pattern, args),
  }
}

/// `pattern` with each positional placeholder (`{}`, or a bare format spec such as `{:.1}`)
/// replaced by the next of `args`, in order. A placeholder is never read again, so an
/// argument containing `{` stays intact.
fn fill(pattern: &str, args: &[String]) -> String {
  let mut out = pattern.to_string();
  for a in args {
    // The next positional placeholder: `{}`, or `{` `:` … `}` (a format spec, no nesting).
    let mut span = None;
    let b = out.as_bytes();
    let mut i = 0;
    while i < b.len() {
      if b[i] == b'{' {
        if let Some(e) = out[i + 1..].find('}') {
          let inner = &out[i + 1..i + 1 + e];
          if inner.is_empty() || inner.starts_with(':') {
            span = Some(i..i + 2 + e);
            break;
          }
        }
      }
      i += 1;
    }
    if let Some(p) = span {
      out.replace_range(p, a);
    }
  }
  out
}

/// The Arabic dictionary: English → العربية, sorted for binary search.
static AR: &[(&str, &str)] = &[
    ("16:9 (Wide)", "16:9 (عريض)"),
    ("21:9 (Wide)", "21:9 (عريض)"),
    ("2:3 (Tall)", "2:3 (طويل)"),
    ("3:2 (Wide)", "3:2 (عريض)"),
    ("3:4 (Tall)", "3:4 (طويل)"),
    ("3D Object", "كائن ثلاثي الأبعاد"),
    ("3D Stage", "مسرح ثلاثي الأبعاد"),
    ("3D World", "عالم ثلاثي الأبعاد"),
    ("4:3 (Wide)", "4:3 (عريض)"),
    ("4:5 (Tall)", "4:5 (طويل)"),
    ("9:16 (Tall)", "9:16 (طويل)"),
    ("9:21 (Tall)", "9:21 (طويل)"),
    // Craft AI: the family's built-in local assistant page, its models and tasks.
    ("A local model is not a frontier cloud model: it can be wrong, and a long answer takes its time on CPU. Check anything critical, and mind a model's size against this machine before downloading it.", "النموذج المحلي ليس نموذجًا سحابيًا ضخمًا: قد يخطئ، والإجابة الطويلة تأخذ وقتها على المعالج. تحقّق من كل أمر حرج، وانتبه لحجم النموذج مقابل هذا الجهاز قبل تنزيله."),
    ("A reference image is missing its link. Please add it again.", "صورة مرجعية واحدة فقدت رابطها. أضفها من جديد."),
    ("About", "حول"),
    ("Accepts {} files", "يقبل ملفات {}"),
    ("Add a prompt, then generate", "أضف مطالبة نصية ثم أنشئ"),
    ("Add a prompt, then generate.", "أضف مطالبة نصية ثم أنشئ."),
    ("Add a starting image before generating", "أضف صورة بداية قبل الإنشاء"),
    ("Add audio", "إضافة صوت"),
    ("Add your {} account to ArtCraft!", "أضف حسابك في {} إلى ArtCraft!"),
    ("Almost done...", "أوشك على الانتهاء..."),
    ("Approve the sign-in in your browser and check the code matches. This window updates by itself.", "وافق على تسجيل الدخول في متصفحك وتأكد من تطابق الرمز. تتحدّث هذه النافذة تلقائياً."),
    ("ArtCraft native {}", "تطبيق ArtCraft الأصلي {}"),
    ("Ask", "اسأل"),
    ("Ask anything", "اسأل أي شيء"),
    ("Ask in any language", "اسأل بأي لغة"),
    ("Assistant", "المساعد"),
    ("Audio", "صوت"),
    ("Audio Support", "دعم الصوت"),
    ("Audio Track ({}/{})", "مقطع صوتي ({}/{})"),
    ("Audio generation enqueued!", "أُدرج إنشاء الصوت في قائمة الانتظار!"),
    ("Audio references aren't available here", "مراجع الصوت غير متاحة هنا"),
    ("Audio track required", "مطلوب مقطع صوتي"),
    ("Audio {}", "صوت {}"),
    ("Audio {} \u{b7} {}s", "صوت {} \u{b7} {} ث"),
    ("Auto", "تلقائي"),
    ("Auto BPM", "BPM تلقائي"),
    ("Auto BPM \u{b7} Auto", "BPM تلقائي \u{b7} تلقائي"),
    ("Auto BPM \u{b7} Cm", "BPM تلقائي \u{b7} دو صغير"),
    ("Auto BPM is left to the model", "يُترك تحديد BPM للنموذج"),
    ("BG Remove", "إزالة الخلفية"),
    ("Beat & Key", "الإيقاع والمقام"),
    ("Best for: a step up in quality, still light", "الأفضل لـ: درجة أعلى في الجودة مع بقائه خفيفًا"),
    ("Best for: balanced everyday and technical work", "الأفضل لـ: التوازن بين العمل اليومي والعمل التقني"),
    ("Best for: everyday help on the lightest machines", "الأفضل لـ: العون اليومي على أخفّ الأجهزة"),
    ("Best for: near-flagship answers at MoE speed", "الأفضل لـ: إجابات قريبة من الرائدة بسرعة خليط الخبراء (MoE)"),
    ("Best for: the deepest reasoning this family has", "الأفضل لـ: أعمق استدلال تملكه هذه العائلة"),
    ("Buy credits", "شراء أرصدة"),
    ("Capable tools for artists.", "أدوات قديرة للفنانين."),
    ("Character \u{201c}{}\u{201d} failed to create", "تعذّر إنشاء الشخصية \u{201c}{}\u{201d}"),
    ("Character \u{201c}{}\u{201d} is being created", "يجري إنشاء الشخصية \u{201c}{}\u{201d}"),
    ("Character name", "اسم الشخصية"),
    ("Characters", "الشخصيات"),
    ("Choose an image, add a prompt, then generate", "اختر صورة، وأضف مطالبة نصية، ثم أنشئ"),
    ("Clear", "مسح"),
    ("Clear all", "مسح الكل"),
    ("Clear all?", "مسح الكل؟"),
    ("Clear style", "مسح النمط"),
    ("Close", "إغلاق"),
    ("Confirmation code", "رمز التأكيد"),
    ("Connect account", "ربط الحساب"),
    ("Copy", "نسخ"),
    ("Copy prompt", "نسخ المطالبة النصية"),
    ("Could not load the original prompt.", "تعذّر تحميل المطالبة النصية الأصلية."),
    ("Couldn't load models: {}", "تعذّر تحميل النماذج: {}"),
    ("Couldn't load your library: {}", "تعذّر تحميل مكتبتك: {}"),
    ("Couldn't open the file: {}", "تعذّر فتح الملف: {}"),
    ("Couldn't open the sign-in window: {}", "تعذّر فتح نافذة تسجيل الدخول: {}"),
    ("Couldn't open the video: {}", "تعذّر فتح الفيديو: {}"),
    ("Couldn't read {}: {}", "تعذّرت قراءة {}: {}"),
    ("Couldn't start generation - the service is temporarily unavailable. Try again shortly.", "تعذّر بدء الإنشاء - الخدمة غير متاحة مؤقتاً. حاول مجدداً بعد قليل."),
    ("Craft AI runs a local Gemma model on this machine. Nothing you write here leaves it: no account, no cloud service, no telemetry — the page talks to a model runtime on 127.0.0.1.", "يشغّل Craft AI نموذج Gemma محليًا على هذا الجهاز. لا يخرج ما تكتبه هنا منه: لا حساب، ولا خدمة سحابية، ولا قياس عن بُعد — الصفحة تتحدث إلى مشغّل نماذج على 127.0.0.1."),
    ("Craft AI runs in the native app — it needs a local model runtime.", "يعمل Craft AI في التطبيق المكتبي — يحتاج مشغّل نماذج محلي."),
    ("Craft AI talks to a model runtime on this machine — Ollama, LM Studio or llama.cpp's server — and never to a cloud service. Start one, then Refresh.", "يتحدث Craft AI إلى مشغّل نماذج على هذا الجهاز — Ollama أو LM Studio أو خادم llama.cpp — ولا يتحدث إلى خدمة سحابية أبدًا. شغّل أحدها ثم حدّث."),
    ("Create Audio", "إنشاء صوت"),
    ("Create Image", "إنشاء صورة"),
    ("Create New", "إنشاء جديد"),
    ("Create Video", "إنشاء فيديو"),
    ("Create account", "إنشاء حساب"),
    ("Data folder", "مجلد البيانات"),
    ("Delete character", "حذف الشخصية"),
    ("Delete character?", "حذف الشخصية؟"),
    ("Delete file", "احذف الملف"),
    ("Delete this media?", "حذف هذه الوسائط؟"),
    ("Describe a scene. See it in motion.", "صِف مشهداً. وشاهده يتحرك."),
    ("Describe a song, a sound, or a sample", "صِف أغنية أو صوتاً أو عيّنة"),
    ("Describe a song, a sound, or a sample.", "صِف أغنية أو صوتاً أو عيّنة."),
    ("Describe anything. See it in seconds.", "صِف أي شيء. وشاهده خلال ثوانٍ."),
    ("Describe the music or sound you want", "صِف الموسيقى أو الصوت الذي تريد"),
    ("Describe the music or sound you want...", "صِف الموسيقى أو الصوت الذي تريده..."),
    ("Describe what you want in the image...", "صِف ما تريد رؤيته في الصورة..."),
    ("Describe what you want to happen in the video...", "صِف ما تريد أن يحدث في الفيديو..."),
    ("Description...", "الوصف..."),
    ("Deselect all", "إلغاء تحديد الكل"),
    ("Disk {}", "القرص {}"),
    ("Download", "تنزيل"),
    ("Download with Ollama", "نزّل عبر Ollama"),
    ("Downloaded {}", "تم تنزيل {}"),
    ("Downloading… {}% — {}", "ينزّل… {}% — {}"),
    ("Drop to add references", "أفلِت لإضافة مراجع"),
    ("Drop to set your frames", "أفلِت لتعيين الإطارات"),
    ("Edit Character", "تحرير الشخصية"),
    ("Edit Image", "تحرير الصورة"),
    ("Edit Video", "تحرير الفيديو"),
    ("Edit character", "تحرير الشخصية"),
    ("English", "English"),
    ("Enter to generate", "Enter للإنشاء"),
    ("Exit selection", "إنهاء التحديد"),
    ("FAL API key", "مفتاح API لـ FAL"),
    ("FAL API key saved", "حُفظ مفتاح API لـ FAL"),
    ("Failed to clear provider credential: {}", "فشل مسح اعتماد المزوّد: {}"),
    ("Failed to save API key: {}", "فشل حفظ مفتاح API: {}"),
    ("Failed to start audio generation", "فشل بدء إنشاء الصوت"),
    ("Failed to start image generation. Please try again.", "فشل بدء إنشاء الصورة. حاول مجدداً."),
    ("Failed to start video generation. Please try again.", "فشل بدء إنشاء الفيديو. حاول مجدداً."),
    ("Failed to upload the reference image: {}", "فشل رفع الصورة المرجعية: {}"),
    ("Failed to upload video. Please upload an MP4 file.", "فشل رفع الفيديو. يرجى رفع ملف MP4."),
    ("Failed to upload {}: {}", "فشل رفع {}: {}"),
    ("First and last frames are already set", "الإطاران الأول والأخير معيّنان بالفعل"),
    ("First frame", "الإطار الأول"),
    ("First/Last frame", "الإطار الأول/الأخير"),
    ("Fits this machine", "يناسب هذا الجهاز"),
    ("Focus mode", "وضع التركيز"),
    ("Forgot password", "هل نسيت كلمة المرور؟"),
    ("Frame Extract", "استخراج الإطارات"),
    ("From library", "من المكتبة"),
    ("General", "عام"),
    ("Generate", "إنشاء"),
    ("Generate images, videos and audio with the best models, steer them with references and keyframes, and keep everything in your library.", "أنشئ صوراً وفيديوهات وصوتاً بأفضل النماذج، وجِهّها بالمراجع والإطارات المفتاحية، واحفظ كل شيء في مكتبتك."),
    ("Generating {} {} \u{b7} Results may appear one at a time", "جارٍ إنشاء {} {} \u{b7} قد تظهر النتائج واحدة تلو الأخرى"),
    ("Generating\u{2026}", "جارٍ الإنشاء\u{2026}"),
    ("Generation failed", "فشل الإنشاء"),
    ("Home", "الرئيسية"),
    ("Image", "صورة"),
    ("Image generation complete!", "اكتمل إنشاء الصورة!"),
    ("Image generation enqueued!", "أُدرج إنشاء الصورة في قائمة الانتظار!"),
    ("Image not available", "الصورة غير متاحة"),
    ("Image references aren't available here", "مراجع الصور غير متاحة هنا"),
    ("Images", "صور"),
    ("Input Mode", "وضع الإدخال"),
    ("Input mode", "وضع الإدخال"),
    ("Keep lyrics", "الاحتفاظ بالكلمات"),
    ("Language", "اللغة"),
    ("Last frame", "الإطار الأخير"),
    ("Last viewed", "آخر مشاهدة"),
    ("Library", "المكتبة"),
    ("Limits", "الحدود"),
    ("Loading\u{2026}", "جارٍ التحميل\u{2026}"),
    ("Local and private", "محلي وخاص"),
    ("Log out", "تسجيل الخروج"),
    ("Login to Midjourney", "تسجيل الدخول إلى Midjourney"),
    ("Looking for a local model runtime…", "البحث عن مشغّل نماذج محلي…"),
    ("Make Video", "إنشاء فيديو"),
    ("Max {} audio track{}", "الحد الأقصى {} مقطعاً صوتياً{}"),
    ("Max {} image reference{}", "الحد الأقصى {} من الصور المرجعية{}"),
    ("Max {} {}{}", "الحد الأقصى {} من {}{}"),
    ("Max {} {}{} / {}s total", "الحد الأقصى {} من {}{} / {} ث إجمالاً"),
    ("Midjourney account", "حساب Midjourney"),
    ("Midjourney connected", "تم ربط Midjourney"),
    ("Midjourney didn't finish this job", "لم يُكمل Midjourney هذه المهمة"),
    ("Model", "النموذج"),
    ("Models", "النماذج"),
    ("Multi-media ref", "مرجع متعدد الوسائط"),
    ("Musical key", "المقام الموسيقي"),
    ("Name cannot be empty", "لا يمكن أن يكون الاسم فارغاً"),
    ("Name this piece", "سمِّ هذا العمل"),
    ("Needs {} GB of RAM", "يحتاج ذاكرة {} غيغابايت"),
    ("Needs {} GB of disk", "يحتاج مساحة {} غيغابايت"),
    ("New Character", "شخصية جديدة"),
    ("Next item", "العنصر التالي"),
    ("No local model runtime found.", "لا يوجد مشغّل نماذج محلي."),
    ("No model installed yet — see the Models tab.", "لا يوجد نموذج مثبّت بعد — انظر تبويب النماذج."),
    ("No prompt", "لا مطالبة نصية"),
    ("No {} in your library yet", "لا {} في مكتبتك بعد"),
    ("No. of {}", "عدد {}"),
    ("Not enough credits for this generation", "لا أرصدة كافية لهذا الإنشاء"),
    ("Not logged in", "غير مسجّل الدخول"),
    ("Not set", "غير معيّن"),
    ("Number of generations", "عدد عمليات الإنشاء"),
    ("OFF", "متوقف"),
    ("ON", "مفعّل"),
    ("Ollama is no longer running — Refresh finds it again.", "لم يعد Ollama يعمل — يجده «تحديث» مجددًا."),
    ("Omni Reference", "مرجع شامل"),
    ("One download serves every ArtCraft app: the model lands in a shared folder all of them read.", "تنزيل واحد يكفي كل تطبيقات ArtCraft: يوضع النموذج في مجلد مشترك تقرؤه كلها."),
    ("Only image files can be added here", "يمكن إضافة ملفات الصور فقط هنا"),
    ("Only {} files can be added here", "يمكن إضافة ملفات {} هنا فقط"),
    ("Open data folder", "فتح مجلد البيانات"),
    ("Open in web app", "فتح في تطبيق الويب"),
    ("Open page again", "افتح الصفحة مجدداً"),
    ("Output Format", "صيغة الإخراج"),
    ("Output format", "صيغة الإخراج"),
    ("Paste your FAL API key", "الصق مفتاح API لـ FAL"),
    ("Paste your prompt, or the idea behind it", "الصق مطالبتك النصية أو الفكرة الكامنة خلفها"),
    ("Paste your {} API key to generate with your own {} account. You can add all of your AI accounts to ArtCraft to use them all in one place and build the ultimate AI art tool.", "الصق مفتاح API الخاص بك في {} للإنشاء بحسابك الخاص في {}. يمكنك إضافة جميع حسابات الذكاء الاصطناعي لديك إلى ArtCraft لاستخدامها كلها من مكان واحد وبناء أداة الفن بالذكاء الاصطناعي المثالية."),
    ("Payment required", "الدفع مطلوب"),
    ("Pick from library", "اختيار من المكتبة"),
    ("Pitch", "درجة الصوت"),
    ("Play in your video player", "تشغيل في مشغل الفيديو لديك"),
    ("Play video previews", "تشغيل معاينات الفيديو"),
    ("Please add a starting frame image to generate video", "أضف صورة إطار بداية لإنشاء الفيديو"),
    ("Please enter a character name", "أدخل اسم الشخصية"),
    ("Please enter a prompt to generate video", "أدخل مطالبة نصية لإنشاء الفيديو"),
    ("Please select a model to generate video", "اختر نموذجاً لإنشاء الفيديو"),
    ("Please upload a reference image", "ارفع صورة مرجعية"),
    ("Please wait for your references to finish uploading", "انتظر اكتمال رفع مراجعك"),
    ("Polish a prompt", "حسِّن مطالبة نصية"),
    ("Previous item", "العنصر السابق"),
    ("Prompt", "المطالبة النصية"),
    ("Prompt copied", "تم نسخ المطالبة النصية"),
    ("Prompt exceeds the {} character limit for this model", "تتجاوز المطالبة النصية حد {} محرفاً لهذا النموذج"),
    ("Prompt too long", "المطالبة النصية طويلة جداً"),
    ("Provider accounts", "حسابات المزوّدين"),
    ("RAM {} GB", "الذاكرة {} غيغابايت"),
    ("Refresh", "تحديث"),
    ("Remove", "إزالة"),
    ("Remove audio", "إزالة الصوت"),
    ("Remove image", "إزالة الصورة"),
    ("Removed audio reference \u{2014} it can't be combined with an image", "أُزيل المرجع الصوتي \u{2014} لا يمكن دمجه مع صورة"),
    ("Removed image reference \u{2014} it can't be combined with audio", "أُزيلت الصورة المرجعية \u{2014} لا يمكن دمجها مع الصوت"),
    ("Runtime", "المشغّل"),
    ("Save model file", "احفظ ملف النموذج"),
    ("Saved a screenshot to {}", "حُفظت لقطة الشاشة في {}"),
    ("Saved in the shared folder", "محفوظ في المجلد المشترك"),
    ("Saving… {}%", "يحفظ… {}%"),
    ("See all", "عرض الكل"),
    ("Select Model", "اختيار النموذج"),
    ("Select Provider", "اختيار المزوّد"),
    ("Select items", "تحديد عناصر"),
    ("Select model", "اختيار النموذج"),
    ("Set up {}", "إعداد {}"),
    ("Settings", "الإعدادات"),
    ("Share link copied", "تم نسخ رابط المشاركة"),
    ("Sign in", "تسجيل الدخول"),
    ("Sign in to ArtCraft", "تسجيل الدخول إلى ArtCraft"),
    ("Sign in to create", "سجّل الدخول للإنشاء"),
    ("Sign in to see everything you've generated.", "سجّل الدخول لرؤية كل ما أنشأته."),
    ("Sign in to start", "سجّل الدخول للبدء"),
    ("Sign in with browser", "تسجيل الدخول عبر المتصفح"),
    ("Signed in as @{}", "مسجّل الدخول باسم @{}"),
    ("Signing in\u{2026}", "جارٍ تسجيل الدخول\u{2026}"),
    ("Sound: OFF", "الصوت: متوقف"),
    ("Sound: ON", "الصوت: مفعّل"),
    ("Starting frame required", "مطلوب إطار بداية"),
    ("Still thumbnails", "مصغّرات ثابتة"),
    ("Style", "النمط"),
    ("Style ideas", "أفكار للأسلوب"),
    ("Style: e.g. dreamy synth-pop, female vocals", "النمط: مثال dreamy synth-pop، أصوات نسائية"),
    ("Swap frames", "تبديل الإطارات"),
    ("Task", "المهمة"),
    ("Text prompt violates content policy", "تنتهك المطالبة النصية سياسة المحتوى"),
    ("That file type isn't supported", "نوع الملف هذا غير مدعوم"),
    ("The Midjourney sign-in window is on {host}", "نافذة تسجيل الدخول إلى Midjourney على {host}"),
    ("The shared folder:", "المجلد المشترك:"),
    ("Thinking… {}s", "يفكر… {}ث"),
    ("This clears the prompt and also removes the attached references.", "يمسح هذا المطالبةَ النصية ويزيل أيضاً المراجع المرفقة."),
    ("This machine: {} GB RAM, {} GB free", "هذا الجهاز: ذاكرة {} غيغابايت، ومساحة متاحة {} غيغابايت"),
    ("This model can't generate from text alone - add a starting frame to animate your prompt.", "لا يستطيع هذا النموذج الإنشاء من نص وحده - أضف إطار بداية لتحريك مطالبتك."),
    ("This tool is coming to the native app. You can use it in the ArtCraft web app in the meantime.", "هذه الأداة قادمة إلى التطبيق الأصلي. يمكنك استخدامها في تطبيق ArtCraft على الويب في هذه الأثناء."),
    ("This will permanently remove the media from your library. This action cannot be undone.", "سيؤدي هذا إلى إزالة الوسائط نهائياً من مكتبتك. لا يمكن التراجع عن هذا الإجراء."),
    ("Toggle Sidebar", "إظهار/إخفاء الشريط الجانبي"),
    ("Too spicy", "محتوى غير لائق"),
    ("Total audio duration cannot exceed {}s", "لا يمكن أن تتجاوز إجمالي مدة الصوت {} ثانية"),
    ("Total {} duration cannot exceed {}s", "لا يمكن أن يتجاوز إجمالي مدة {} {} ثانية"),
    ("Upload reference image", "رفع صورة مرجعية"),
    ("Uploading\u{2026}", "جارٍ الرفع\u{2026}"),
    ("Use @Image1, @Video1, @Audio1... to reference uploads in prompt...", "استخدم @Image1 و@Video1 و@Audio1... للإشارة إلى الملفات المرفوعة داخل المطالبة..."),
    ("Use selected", "استخدام المحدد"),
    ("Use your ArtCraft account to generate images and videos.", "استخدم حسابك في ArtCraft لإنشاء الصور والفيديوهات."),
    ("Username or email", "اسم المستخدم أو البريد الإلكتروني"),
    ("Video", "فيديو"),
    ("Video generation enqueued!", "أُدرج إنشاء الفيديو في قائمة الانتظار!"),
    ("Video or audio", "فيديو أو صوت"),
    ("Videos", "فيديوهات"),
    ("Videos (MP4)", "فيديوهات (MP4)"),
    ("View full size", "عرض بالحجم الكامل"),
    ("Volume", "مستوى الصوت"),
    ("What do you want to see or hear?", "ماذا تريد أن ترى أو تسمع؟"),
    ("What the piece shows, for names", "ماذا يعرض العمل، لأجل التسمية"),
    ("What you're making, for style directions", "ماذا تنشئ، لاستلهام اتجاهات الأسلوب"),
    ("When on, pressing Enter submits the prompt and Shift+Enter adds a new line. When off (default), both Enter and Shift+Enter add a new line - use only the button to submit.", "عند التفعيل، يرسل مفتاح Enter المطالبة النصية ويضيف Shift+Enter سطراً جديداً. عند التعطيل (الافتراضي)، يضيف كلا المفتاحين سطراً جديداً - استخدم زر الإنشاء وحده للإرسال."),
    ("Write a prompt", "اكتب مطالبة نصية"),
    ("You can add your {} account to ArtCraft by simply logging in. Use your credits and account directly within ArtCraft. You can add all of your AI accounts to ArtCraft to use them all in one place and build the ultimate AI art tool.", "يمكنك إضافة حسابك في {} إلى ArtCraft بمجرد تسجيل الدخول. استخدم أرصدتك وحسابك مباشرة داخل ArtCraft. يمكنك إضافة جميع حسابات الذكاء الاصطناعي لديك إلى ArtCraft لاستخدامها كلها من مكان واحد وبناء أداة الفن بالذكاء الاصطناعي المثالية."),
    ("Your credit balance \u{b7} Buy credits", "رصيدك \u{b7} شراء أرصدة"),
    ("Your generations will appear here.", "ستظهر إنشاءاتك هنا."),
    ("\u{201c}{}\u{201d} will be removed from your characters.", "\u{201c}{}\u{201d} ستُزال من شخصياتك."),
    ("audio", "صوت"),
    ("audio clip", "مقطع صوتي"),
    ("audio clips", "مقاطع صوتية"),
    ("audio model", "نموذج صوتي"),
    ("audio or image", "صوت أو صورة"),
    ("day", "يوم"),
    ("disabled without a prompt", "معطّل بلا مطالبة نصية"),
    ("file", "ملف"),
    ("hour", "ساعة"),
    ("image", "صورة"),
    ("image reference", "صورة مرجعية"),
    ("images", "صور"),
    ("just now", "الآن"),
    ("minute", "دقيقة"),
    ("month", "شهر"),
    ("reference", "مرجع"),
    ("required", "مطلوب"),
    ("video", "فيديو"),
    ("videos", "فيديوهات"),
    ("year", "سنة"),
    ("{} Generation", "إنشاء {}"),
    ("{} \u{2014} add one first", "{} \u{2014} أضف واحداً أولاً"),
    ("{} \u{b7} {}/{}s", "{} \u{b7} {}/{} ث"),
    ("{} credits", "الأرصدة: {}"),
    ("{} credit{} cost", "التكلفة: {} رصيد{}"),
    ("{} generation complete!", "اكتمل إنشاء {}!"),
    ("{} isn't a supported file", "{} ليس ملفاً مدعوماً"),
    ("{} needs an audio track to work from \u{2014} add one first", "{} يحتاج مقطعاً صوتياً يعمل منه \u{2014} أضف واحداً أولاً"),
    ("{} references aren't available here", "مراجع {} غير متاحة هنا"),
    ("{} reference{}", "{} من المراجع{}"),
    ("{} selected", "{} محدد"),
    ("{} {}{} ago", "قبل {} {}{}"),
    ("{}/{} selected", "{}/{} محدد"),
    ("{}: {}", "{}: {}"),
    ("{}s", "{} ث"),
    ("~{}h", "~{} س"),
    ("~{}h {}m", "~{} س {} د"),
    ("~{}m", "~{} د"),
    ("~{}s", "~{} ث"),
    ("العربية", "العربية"),
];

fn tr_ar_index(s: &str) -> Option<usize> {
  AR.binary_search_by(|(k, _)| (*k).cmp(s)).ok()
}

/// The dictionary's Arabic side in visual order (`bidi.rs`), built once and shared by every
/// `t()` call: the runs left to right as a right-to-left reader meets them, the letters
/// inside each run in logical order for the shaper.
fn visual_ar() -> &'static [String] {
  static VISUAL: OnceLock<Vec<String>> = OnceLock::new();
  VISUAL.get_or_init(|| AR.iter().map(|(_, ar)| bidi::visual_rtl(ar)).collect())
}

#[cfg(test)]
mod tests {
  use super::*;

  /// The `{}` (and `{:…}`) placeholders of a pattern, in order.
  fn placeholders(s: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let b = s.as_bytes();
    let mut i = 0;
    while i < b.len() {
      if b[i] == b'{' {
        if let Some(e) = s[i + 1..].find('}') {
          out.push(&s[i..i + 2 + e]);
          i += 2 + e;
          continue;
        }
      }
      i += 1;
    }
    out
  }

  #[test]
  fn translations_keep_placeholders() {
    for (en, ar) in AR {
      assert_eq!(placeholders(en), placeholders(ar), "placeholder mismatch: {en}");
    }
  }

  #[test]
  fn unknown_strings_fall_back_to_english() {
    set_language(Language::Arabic);
    assert_eq!(t("Not in the dictionary"), "Not in the dictionary");
    assert_eq!(t("Nano Banana Pro"), "Nano Banana Pro");
    set_language(Language::English);
  }

  /// Arabic's lookups come back in visual order (`bidi.rs`): the runs in the order egui
  /// draws them, the letters inside each run in logical order for the shaper.
  #[test]
  fn arabic_lookups_read_right_to_left() {
    set_language(Language::Arabic);
    assert_eq!(t("Sign in"), "الدخول تسجيل");
    assert_eq!(t("Settings"), "الإعدادات");
    set_language(Language::English);
  }

  #[test]
  fn tf_substitutes_in_order() {
    set_language(Language::Arabic);
    let out = tf("Signed in as @{}", &["mira".to_owned()]);
    assert!(out.contains("@mira"), "{out}");
    assert!(!out.contains("{}"), "{out}");
    let two = tf("Couldn't read {}: {}", &["a.png".to_owned(), "gone".to_owned()]);
    assert!(two.contains("a.png") && two.contains("gone"), "{two}");
    set_language(Language::English);
    assert_eq!(tf("{} of {}", &["1".to_owned(), "2".to_owned()]), "1 of 2");
  }

  /// The dictionary is a binary-searched static: it MUST stay sorted, or lookups
  /// silently miss. (This test would have caught an unsorted merge.)
  #[test]
  fn the_arabic_dictionary_stays_sorted_and_searchable() {
    for w in AR.windows(2) {
      assert!(w[0].0 < w[1].0, "dictionary out of order: {:?} >= {:?}", w[0].0, w[1].0);
    }
    // every English key is found through the binary search itself:
    for (k, v) in AR {
      let looked = AR.binary_search_by(|(e, _)| (*e).cmp(k));
      assert!(looked.is_ok(), "binary search cannot find {k:?}");
      assert_eq!(AR[looked.unwrap()].1, *v);
    }
  }

  #[test]
  fn spot_translations_follow_office_terminology() {
    assert_eq!(t("Sign in"), "Sign in");
    set_language(Language::Arabic);
    assert_eq!(t("Sign in"), "تسجيل الدخول");
    assert_eq!(t("Create Image"), "إنشاء صورة");
    assert_eq!(t("Aspect Ratio"), "نسبة العرض إلى الارتفاع");
    assert_eq!(t("Settings"), "الإعدادات");
    assert_eq!(t("Generate"), "إنشاء");
    assert_eq!(t("Library"), "المكتبة");
    assert_eq!(t("ON"), "مفعّل");
    assert_eq!(t("Download"), "تنزيل");
    set_language(Language::English);
    assert_eq!(t("Settings"), "Settings");
  }

  /// Any `ar-XX` region resolves to Arabic, like the other Craft apps.
  #[test]
  fn arabic_locale_tags_resolve() {
    assert_eq!(Language::from_code("ar"), Language::Arabic);
    assert_eq!(Language::from_code("ar-SA"), Language::Arabic);
    assert_eq!(Language::from_code("ar_EG"), Language::Arabic);
    assert_eq!(Language::from_code("en"), Language::English);
  }
}
