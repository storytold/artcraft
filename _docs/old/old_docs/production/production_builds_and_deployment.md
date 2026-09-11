production builds and deployment
================================

### Github Docker builds

The repository needs to be given read access to the base docker image:

https://github.com/orgs/storytold/packages/container/docker-base-images-rust-ssl/settings

These instructions assume running on GCP.

### Database migrations

1. Set `DATABASE_URL` in `.env` to the production secrets (DO NOT COMMIT!)
2. Run `diesel migration run`

### Setting up public buckets without list permission

Public buckets that deny the `list` action should use the following Role:

`roles/storage.legacyObjectReader`

See:

* https://stackoverflow.com/a/56354633
* https://cloud.google.com/storage/docs/access-control/making-data-public#buckets

### Generating Bucket Access Key and Secret Key

https://cloud.telestream.net/tutorials/how-to-setting-up-google-cloud-storage/

1. Go to the GCS page
2. Click "settings"
3. Click "interoperability" tab
4. (enable interoperable access if not already set)
5. Click "create new key"
