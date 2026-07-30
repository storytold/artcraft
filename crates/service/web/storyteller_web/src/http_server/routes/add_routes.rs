use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::App;

use log::{info, warn};
use server_environment::ServerEnvironment;

use crate::http_server::routes::application_routes::add_application_routes::add_application_routes;
use crate::http_server::routes::legacy_routes::add_legacy_routes::add_legacy_routes;
use crate::http_server::routes::service_routes::add_service_routes;

pub fn add_routes<T, B> (app: App<T>, server_environment: ServerEnvironment) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  let mut app = app;

  app = add_legacy_routes(app); // various legacy routes, mostly deprecated
  app = add_application_routes(app); // Primary product service area routes
  app = add_local_media_route(app, server_environment); // Dev-only static media (fully-local stack)
  app = add_service_routes(app); // Essential service routes (status, health, info, etc.)

  app
}

/// Dev-only: serve media files from a local directory at /media, mirroring the
/// public bucket's layout, so a fully-local stack (CDN_BASE_URL pointed at this
/// server) can render seeded and fake-generated media without any cloud bucket.
/// LOCAL_MEDIA_ROOT is the bucket root: an object with rooted path
/// /media/{...} is read from {LOCAL_MEDIA_ROOT}/media/{...}.
/// No-op in production and when LOCAL_MEDIA_ROOT is unset.
fn add_local_media_route<T, B> (app: App<T>, server_environment: ServerEnvironment) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  if !server_environment.is_development() {
    return app;
  }
  let root = match std::env::var("LOCAL_MEDIA_ROOT") {
    Ok(root) if !root.trim().is_empty() => root,
    _ => return app,
  };
  let media_dir = std::path::Path::new(&root).join("media");
  if let Err(err) = std::fs::create_dir_all(&media_dir) {
    // Fall back to remote CDN behavior rather than refusing to boot.
    warn!("LOCAL_MEDIA_ROOT set but '{}' is not creatable ({}); /media not mounted", media_dir.display(), err);
    return app;
  }
  info!("Dev local media: serving {} at /media", media_dir.display());
  app.service(actix_files::Files::new("/media", media_dir))
}
