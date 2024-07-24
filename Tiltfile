# -*- mode: Python -*-

if k8s_context() != 'black1':
  fail("failing early to avoid overwriting prod")
local_resource('storyteller-web-binary',
cmd='SQLX_OFFLINE=true cargo build --release --bin storyteller-web --target=x86_64-unknown-linux-musl',
)

allow_k8s_contexts('black1')
sync_src_crates = sync('./crates', '/storyteller-rust/source/crates')
sync_src_sql = sync('./_sql', '/storyteller-rust/source/_sql')
sync_src_cargo_lock = sync('./Cargo.lock', '/storyteller-rust/source/Cargo.lock')
sync_src_cargo = sync('./Cargo.toml', '/storyteller-rust/source/Cargo.toml')
sync_src_env = sync('./.env', '/storyteller-rust/source/.env')
sync_src_startup = sync('./_develop/localdev/startup.sh', '/storyteller-rust/_develop/localdev/startup.sh')
sync_src_storyteller_binary = sync('./target/x86_64-unknown-linux-musl/release/storyteller-web', '/storyteller-rust/target/x86_64-unknown-linux-musl/release/storyteller-web')
docker_build('storyteller-web',
 '.',
 dockerfile='_develop/localdev/Dockerfile',
 platform='linux/amd64',
 only=[
 './target/x86_64-unknown-linux-musl/release/storyteller-web',
 '_develop/localdev/Dockerfile',
 './_develop/localdev/startup.sh',
 'crates/service/web/storyteller_web/config/storyteller-web.development.env',
 '_sql', 'diesel.toml', '.env'],
 live_update = [
    sync_src_crates,
    sync_src_sql,
    sync_src_cargo_lock,
    sync_src_cargo,
    sync_src_env,
    sync_src_startup,
    sync_src_storyteller_binary,
    run('date > /restart.txt')
     ],
 )
k8s_yaml('_develop/localdev/kubernetes.yml',

)
k8s_resource(
  objects=['ssd-hostpath:storageclass', 'test-pvc:persistentvolumeclaim'],
  new_name='storyteller-web-pvc',
  trigger_mode=TRIGGER_MODE_MANUAL,
)
k8s_resource('mysql', port_forwards='3307:3306')
k8s_resource('storyteller-web', port_forwards=12345)