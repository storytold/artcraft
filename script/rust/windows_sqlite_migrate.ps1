# This script is a little rough

# Step 1
cargo sqlx migrate run \
  --database-url "sqlite:C:\Users\Bombay\AppData\Local\Temp\tasks.sqlite" \
  --source "C:\Users\Bombay\Documents\GitHub\storyteller-rust\_sql\artcraft_migrations"

# Step 2
Push-Location -Path ".\crates\schema\database\sqlite_tasks"
cargo sqlx prepare \
  --database-url "sqlite:C:\Users\Bombay\AppData\Local\Temp\tasks.sqlite"
Pop-Location

