use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use sqlite_tasks::connection::TaskDbConnection;

pub struct TaskDatabase {
  connection: TaskDbConnection,
}

impl TaskDatabase {
  pub async fn connect(root: &AppDataRoot) -> AnyhowResult<Self> {
    let path = root.state_dir().get_tasks_sqlite_database_path();
    let connection = TaskDbConnection::connect_and_migrate(path).await?;
    Ok(Self { connection})
  }

  pub fn get_connection(&self) -> &TaskDbConnection {
    &self.connection
  }
}