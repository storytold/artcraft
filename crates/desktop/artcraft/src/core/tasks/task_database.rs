
pub struct TaskDatabase {
  pub pool: Pool<Sqlite>,
}

impl Database {
  pub async fn new(app_handle: &AppHandle) -> Result<Self> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("failed to get app dir");

    // Ensure the app directory exists
    fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("grid_search.db");

    // Set the DATABASE_URL environment variable to point to this SQLite file
    env::set_var("DATABASE_URL", format!("sqlite://{}", db_path.display()));
  }
}