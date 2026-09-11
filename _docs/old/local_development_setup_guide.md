Local Development Setup Guide (for bare metal)
==============================================

This document describes how to run the FakeYou infrastructure on your development 
machine's bare metal (no containers).

Setup instructions and development were tested and known to work on the following
platforms:

- Mac OS (Apple M2 silicon)
- Ubuntu 22.04
- Windows Subsystem for Linux (Ubuntu 22.04 distro) aka "WSL"

The applications (binary targets) you might be interested in running include, but 
are not limited to:

- `storyteller-web`, the HTTP API server
- `download-job`, which downloads models from the web and stores them in GCS
- `inference-job`, which downloads models from GCS and runs inference with them

Setup Instructions
------------------

### (1) Install Rust

Install Rust [using this guide](https://www.rust-lang.org/learn/get-started). If it asks, 
you'll want "stable" Rust, not "nightly" Rust. If it doesn't ask, it defaults to "stable".

For Windows Subsystem for Linux, you'll want the WSL version, not the `.exe` file!

### (2) Install the necessary libraries

#### Mac

On an up-to-date M1/M2 Mac, there should be no libraries you need to install! Any exceptions 
to this assumption should be documented here.

#### Ubuntu 22.04 and WSL:

If you're on Ubuntu or WSL, you'll need to install some libraries to build the Rust code: 

```bash
# If you haven't run apt before, you'll need to fetch the package list:
sudo apt update

# Install the dependencies
sudo apt install jq \
  libmysqlclient-dev \
  libsqlite3-dev \
  pkgconf
```

(Note: jq is for combining mysql codegen outputs; pkgconf is if using openssl instead of rustls.)

### (3) Install MySQL server

#### Mac

```bash
# Install MySQL
brew install mysql

# Try to connect
mysql -uroot
```

In the event of failure to connect, try the following steps:

```bash
# If connection fails, start service
brew services start mysql

# Try to connect again 
# If this fails, reboot the machine, eg. using `sudo reboot now`
mysql -uroot
```

#### Ubuntu 22.04 and WSL

```bash
# Install MySQL
sudo apt install mysql-server

# Try to connect 
# The default password is typically "root".
sudo mysql -u root -p
````

In the event of failure to connect, try the following steps:

```bash
# If it failed, you may need to start MySQL (typically only on WSL, not on native Ubuntu)
sudo service mysql start

# You may also have to change some socket file permissions (again, typically only on WSL)
sudo chmod g+rx /var/run/mysqld
sudo usermod -aG mysql $USER
newgrp mysql

# Try to connect again
# The default password is typically "root".
# If this fails, try rebooting. If it still fails, read some of the suggestions at the bottom 
# of this README.
sudo mysql -u root -p
```

### (4) Install a `storyteller` user and table in MySQL

First, connect to MySQL:

```bash
# If the following command asks for a password, the password is typically "root"
sudo mysql -u root -p
```

Once in MySQL, run the following to set up the database and user accounts:

```mysql
use mysql;
CREATE DATABASE storyteller;
CREATE USER 'storyteller'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON storyteller.* TO 'storyteller'@'localhost';
```

Then verify access with `./dev_mysql_connect.sh`

### (5) Install Diesel CLI (for MySQL migrations):

In order to run MySQL database migrations, you'll need to install the migration tool we use:

```bash
cargo install diesel_cli \
  --no-default-features \
  --features mysql,sqlite
```

In older Macs, there [have been some issues with Diesel CLI](https://github.com/diesel-rs/diesel/issues/2605)
that require a few extra dependencies to be installed:

```bash
# If you're on Mac and the above command didn't work, run the following and then retry:
brew install libpq
```

### (6) Run the pending database migrations:

You're ready to run the migrations:

```bash
diesel migration run
```

You might get a scary message about `"Encountered unknown type for Mysql: enum"` -- you can safely ignore this 
error if you see it in isolation. It doesn't impact the migrations whatsoever. (See notes at the bottom of 
the README for details.)

### (7) (optional) Install the SQLx CLI (if doing database development)

(You can probably skip this step unless you're a backend engineer.) 

If (and only if) you're doing Rust service development that changes the MySQL queries, then you should install 
SQLx utilities. This tool is used to cache the column types and query plans for CI, as SQLx statically verifies 
raw MySQL queries against the schema and Rust types.

We'll be using diesel to manage the migrations, but sqlx within the app to actually perform queries.
Diesel is an immature ORM, which isn't a good tech bet, so we use sqlx as at-compile-time
typesafe SQL. 

(TODO: Reevaluate this assessment for 2023-2024 and beyond. Maybe we do want Diesel now.)

```bash
# NB(bt,2023-10-04): "--no-default-features" not working
# cargo install sqlx-cli --no-default-features --features rustls,mysql,sqlite
cargo install sqlx-cli --features rustls,mysql,sqlite
```

### (8) Install hosts file:

(This is the same for Linux, Mac, and WSL.)

If you're developing against the frontend, it'll target development domains (eg. `dev.fakeyou.com`) instead 
of `127.0.0.1` or `localhost`. You can make your machine route domains to localhost by editing your hosts 
file (located at `/etc/hosts`) to include the following configuration lines:

```
# 1) Edit hosts file with your editor of choice
#
#  - sudo vi /etc/hosts
#  - sudo nano /etc/hosts
#
# 2) Then paste:
#

127.0.0.1    dev.fakeyou.com
127.0.0.1    api.dev.fakeyou.com
127.0.0.1    devproxy.fakeyou.com

127.0.0.1    dev.storyteller.ai
127.0.0.1    api.dev.storyteller.ai
127.0.0.1    devproxy.storyteller.ai
```

### (9) Install Redis

#### Mac:

```bash
# Install Redis
brew install redis

# Start the service:
brew services start redis
```

#### Ubuntu 22.04 and WSL

```
# Install Redis
sudo apt install redis

# Start the service (typically only needed on WSL):
sudo service redis-server start
```

### (10) Install Elasticsearch (optional)

(You can most likely skip this step.)

Mac: (TODO - haven't installed yet)

WSL: (TODO - haven't installed yet)

Ubuntu 22.04:

Install:

```bash
curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elastic.gpg

echo "deb [signed-by=/usr/share/keyrings/elastic.gpg] https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list

sudo apt update
sudo apt install elasticsearch
```

Configure:

```text
# Edit /etc/elasticsearch/elasticsearch.yml
# Set the following:
network.host: localhost
```

Run:

```bash
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch
```

Verify:

```bash
curl -X GET 'http://localhost:9200'
```

Install Kibana (prototyping UI):

```bash
# Install
sudo apt-get install kibana

# Run
sudo /bin/systemctl daemon-reload
sudo /bin/systemctl enable kibana.service
sudo systemctl start kibana.service

# Access the Kibana Status Page:
# http://localhost:5601/status

# Access the query console UI:
# Click Sidebar > Management > Dev Tools > Console
# http://localhost:5601/
```

Extra reading on setting up Elasticsearch: 

- [Guide 1](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-elasticsearch-on-ubuntu-22-04)
- [Guide 2](https://www.elastic.co/guide/en/elasticsearch/reference/current/deb.html)
- [Kibana](https://www.elastic.co/guide/en/kibana/current/deb.html)

### (11) Run one or more applications:

To start the HTTP API server,

```bash
cargo run --bin storyteller-web
```

Note that this compiles and runs the "development" binary. It's faster and easier to debug than the
optimized "production" build. To build a fully optimized production release,
run `cargo build --release --bin storyteller-web` . Note that this will take much longer.

You may notice that this might not work right off the bat. You may need to specify some environment variables 
and supply some development secrets.

Secrets: 

- Global secrets (ask Brandon for these): 
  - Put `.env-secrets` in the root `storyteller-rust` directory.
  
- Per app secrets (ask Brandon for these):
  - Put `storteller-web.development-secrets.env` in `crates/service/web/storyteller_web/config`
  - Put `inference-job.development-secrets.env` in `crates/service/job/inference_job/config`
  - Put `donwload-job.development-secrets.env` in `crates/service/job/download_job/config`

**DO NOT CHECK THESE SECRET FILES INTO THE REPO!**

Environment config: 

You may need to set local development paths for your environment. You can set these in `.env-secrets` too,
so that they won't be updated for other engineers.

```
# this should be the directory containing all of the "storyteller" projects:
STORYTELLER_ROOT = "/home/tensor/code/storyteller" # change this

# The following are entirely optional, but if you want to fine tune where each project lives, you may do so:
STORYTELLER_FRONTEND = "/somewhere/else/storyteller-frontend"
STORYTELLER_ML = "storyteller-ml"
STORYTELLER_RUST = "/Users/bt/Development/storyteller-rust"
```

To download some ML models, run:

```bash
cargo run --bin download-job
cargo run --bin tts-download-job
```

If you want to run both the HTTP API and the jobs, you'll need to run both processes in different
terminals or tmux sessions.

Note also that the configurations pointing to the ML monorepo must be set up for each application.
Additionally, some development secrets may be needed (ask the team to share).

To execute ML inference, run:

```bash
cargo run --bin inference-job
cargo run --bin tts-inference-job
```

Again, note that the configurations pointing to the ML monorepo must be set up for each application.
Additionally, some development secrets may be needed (ask the team to share).

Seeding the Database with Some Values
-------------------------------------
For voice designer you might want some pre-seeded audio that will hit the google cloud bucket, it will require env-secrets ask Brandon.
cargo run --bin dev-database-seed -- --bucket

Solutions to Common Setup Problems 
-----------------------------------

### [Fix] Sqlx Error when Performing Schema Migrations

You might get this error message during migration,

```
Encountered unknown type for Mysql: enum
thread 'main' panicked at 'internal error: entered unreachable code: Mysql only supports a closed set of types.
                         If you ever see this error message please open an issue at https://github.com/diesel-rs/diesel 
                         containing a dump of your schema definition.', diesel_cli/src/print_schema.rs:310:17
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

I haven't found the cause (it doesn't happen on newer installs), but the migrations appear to work regardless 
of this error message. You can essentially ignore it.

### [Fix] Can't connect to local MySQL after install on Ubuntu

- If MySql in local dev can't be connected to, [reset the accounts](https://linuxconfig.org/how-to-reset-root-mysql-mariadb-password-on-ubuntu-20-04-focal-fossa-linux).

### API Server
```
cargo run --bin docs
```
This setups an api server with swagger docs to show you responses and requests with each associated endpoint
It is run at http://127.0.0.1:8989/
To obtain the json for the postman collection go to this url http://127.0.0.1:8989/api-docs/openapi.json
We use this: `https://github.com/juhaku/utoipa`
The documentation example is in: 
`crates/service/web/storyteller_web/src/http_server/endpoints/voice_designer/inference/enqueue_tts_request.rs`
Write into the api doc to: 
`crates/service/web/storyteller_web/src/api_doc.rs`
