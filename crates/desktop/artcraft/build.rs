fn main() {
  // For SQLx
  std::env::set_var("DATABASE_URL", format!("sqlite:///Users/bt/Artcraft/state/tasks_v1.sqlite"));
  tauri_build::build()
}
