# ArtCraft Server

ArtCraft's server is a Rust / Actix app called `storyteller-web`.

You don't need to run this to develop the ArtCraft application, but it can be useful to spin up
a development instance for adding new server functions or as your own private local copy.

`storyteller-web` can function entirely within the development environment, and ArtCraft can be
pointed to a local instance of the server.

**TODO**: Concisely describe setting up server components. Note: we have
previous docs in `old/` that may still be relevant, though they're perhaps
slightly out of date.

## Server Setup (Mac)

### Install and Migrate MySQL Database

```bash
# For now, the tooling doesn't support MySQL 9.6 as it was just released in January 2026.
# This will probably change in the future to no longer need to specify the 8.* series.
brew install mysql@8.4

# Try to connect
mysql -uroot

# If connection fails, start service, then try again.
brew services start mysql
mysql -uroot

# If that fails, reboot and try connecting again.
```

Create the `storyteller` database table. Connect to the database:

```bash
sudo mysql -u root

# If it needs a password, use argument -p and when prompted use "root" as the typical default password
```

Then run this:

```mysql
use mysql;
CREATE DATABASE storyteller;
CREATE USER 'storyteller'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON storyteller.* TO 'storyteller'@'localhost';
```

Then verify access with `./script/dev_mysql_connect.sh`

```bash
cargo install diesel_cli \
  --no-default-features \
  --features mysql,sqlite
```

If this fails,

```bash
brew install zstd
brew install openssl
```

Possibly,

```bash
export RUSTFLAGS="-L$(brew --prefix zstd)/lib -L$(brew --prefix openssl)/lib"
```

In older Macs, there [have been some issues with Diesel CLI](https://github.com/diesel-rs/diesel/issues/2605)
that require a few extra dependencies to be installed:

```bash
# If you're on Mac and the above command didn't work, run the following and then retry:
brew install libpq
```

You're ready to run the migrations:

```bash
diesel migration run
```

You might get a scary message about `"Encountered unknown type for Mysql: enum"` -- you can safely ignore this
error if you see it in isolation. It doesn't impact the migrations whatsoever.

Finally, you'll need the sqlx CLI tool to run codegen. 
You likely won't need this now, but if you change any queries, this will be necessary:

```bash
cargo install sqlx-cli --features rustls,mysql,sqlite
```

### Install Redis (Mac)

```bash
# Install Redis
brew install redis

# Start the service:
brew services start redis
```

