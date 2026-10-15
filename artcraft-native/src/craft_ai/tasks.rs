//! What Craft AI does inside ArtCraft. Craft AI is one assistant across the ArtCraft family —
//! the model, the runtime and the shared folder belong to the family — but its *work* is the
//! app's own: the system prompt tells the model which app it is inside and what that app does,
//! and every ready-made task is framed for that app's world, so the answer that comes back is
//! about prompts, references and models, not generic advice.
//!
//! Each app of the family carries its own `tasks.rs` — DeckCraft's asks about slides and
//! masters, VectorCraft's about paths and shapes, and so on — same model, same shared folder,
//! different craft. The labels and hints are dictionary rows: the page shows them translated.

/// The app Craft AI is embedded in, as the shared folder's records name it.
pub const APP: &str = "artcraft";

/// One ready-made task of the Assistant tab.
pub struct Task {
  /// The label the picker shows (a dictionary key).
  pub label: &'static str,
  /// The input field's hint (a dictionary key).
  pub hint: &'static str,
}

/// The tasks, in the picker's order.
pub const TASKS: &[Task] = &[
  Task { label: "Ask anything", hint: "Ask in any language" },
  Task { label: "Write a prompt", hint: "What do you want to see or hear?" },
  Task { label: "Polish a prompt", hint: "Paste your prompt, or the idea behind it" },
  Task { label: "Style ideas", hint: "What you're making, for style directions" },
  Task { label: "Name this piece", hint: "What the piece shows, for names" },
];

/// Tell the model where it is and how to answer: briefly, practically, in the language the user
/// wrote in, about this app's own world — the words of its interface, the media it makes. The
/// last line is the honesty clause: a local model can be wrong, and it is told to say so
/// rather than invent.
pub fn system_prompt() -> String {
  "You are Craft AI, the assistant built into ArtCraft, a desktop app for making images, \
   videos and audio with AI models. ArtCraft's world, in its own words: the prompt box and its \
   references — images, videos and audio clips attached to a prompt — and the first and last \
   frames that steer a video; the image, video and audio models and their makers; styles and \
   characters; the Create Image, Create Video and Create Audio pages; the library of \
   everything generated and the lightbox over it; credits, the account and the providers \
   behind the create pages. Answer in the language the user wrote in, Arabic included. Be \
   brief and practical: name the page and the control, give the steps as a short list, say \
   what to watch out for, and when a question is not about ArtCraft or making art with AI, \
   answer it anyway, briefly. Never invent buttons or model names: if you are not sure \
   ArtCraft has a feature, say so plainly."
    .to_string()
}

/// Frame the user's input for the task they picked.
pub fn user_prompt(task: usize, input: &str) -> String {
  let input = input.trim();
  match TASKS[task.min(TASKS.len() - 1)].label {
    "Write a prompt" => format!(
      "Write a prompt for ArtCraft that makes this — subject, setting, style, the details that \
       matter: {input}"
    ),
    "Polish a prompt" => format!("Polish this prompt for ArtCraft — keep what it asks for, make the model more likely to deliver it: {input}"),
    "Style ideas" => format!("Suggest style directions for this piece — a handful of options, each a line an artist could use in a prompt: {input}"),
    "Name this piece" => format!("Suggest short, fitting names for this piece — a handful of options, no explanations: {input}"),
    _ => input.to_string(),
  }
}
