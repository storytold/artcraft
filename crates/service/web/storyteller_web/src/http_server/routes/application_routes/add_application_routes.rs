use crate::http_server::routes::application_routes::analytics_routes::add_analytics_routes;
use crate::http_server::routes::application_routes::comments_routes::add_comments_routes;
use crate::http_server::routes::application_routes::credits_routes::add_credits_routes;
use crate::http_server::routes::application_routes::featured_item_routes::add_featured_item_routes;
use crate::http_server::routes::application_routes::generate_routes::add_generate_routes;
use crate::http_server::routes::application_routes::job_routes::add_job_routes;
use crate::http_server::routes::application_routes::media_files_routes::add_media_file_routes;
use crate::http_server::routes::application_routes::moderation_routes::add_moderator_routes;
use crate::http_server::routes::application_routes::omni_gen_routes::add_omni_gen_routes;
use crate::http_server::routes::application_routes::prompts_routes::add_prompts_routes;
use crate::http_server::routes::application_routes::stripe_artcraft_routes::add_stripe_artcraft_routes;
use crate::http_server::routes::application_routes::subscription_routes::add_subscription_routes;
use crate::http_server::routes::application_routes::tag_routes::add_tag_routes;
use crate::http_server::routes::application_routes::user_bookmarks_routes::add_user_bookmarks_routes;
use crate::http_server::routes::application_routes::user_rating_routes::add_user_rating_routes;
use crate::http_server::routes::application_routes::user_routes::add_user_routes;
use crate::http_server::routes::application_routes::wallet_routes::add_wallet_routes;
use crate::http_server::routes::application_routes::web_referrals_routes::add_web_referrals_routes;
use crate::http_server::routes::application_routes::webhook_routes::add_webhook_routes;
use crate::http_server::routes::application_routes::weights_routes::add_weights_routes;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{App, Error};
use billing_component::default_routes::add_suggested_stripe_billing_routes;

/// Add the core application routes.
pub fn add_application_routes<T, B> (app: App<T>) -> App<T>
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

  let mut app = add_moderator_routes(app); // /moderation

  // Artcraft surface area
  app = add_generate_routes(app); // /v1/generate/...
  app = add_omni_gen_routes(app); // /v1/omni_gen/...
  app = add_webhook_routes(app); // /v1/webhooks/... (fal)
  
  // Legacy FakeYou surface area that might be useful again one day
  app = add_tag_routes(app); // /v1/tags
  app = add_weights_routes(app); // v1/weights

  // Media files routes
  app = add_media_file_routes(app); // /v1/media_files/...
  app = add_featured_item_routes(app); // /v1/featured_item/...
  app = add_prompts_routes(app); // /v1/prompts/...

  // Job system
  app = add_job_routes(app);

  // Other useful tools
  app = add_analytics_routes(app); // /v1/analytics/...
  app = add_web_referrals_routes(app); // /v1/web_referrals/...

  // User and user-adjacent routes
  app = add_comments_routes(app); // /v1/comments/...
  app = add_user_bookmarks_routes(app); // /v1/user_bookmarks/...
  app = add_user_rating_routes(app); // /v1/user_rating/...
  app = add_user_routes(app); // /create_account, /session, /login, /logout, etc.

  // Artcraft Billing pieces
  app = add_wallet_routes(app); // /v1/wallets/...
  app = add_credits_routes(app); // /v1/credits/...
  app = add_stripe_artcraft_routes(app); // /v1/stripe_artcraft/...
  app = add_subscription_routes(app); // /v1/subscriptions/...

  // FakeYou Billing component - still necessary for FakeYou monetization
  app = add_suggested_stripe_billing_routes(app); // /stripe, billing, webhooks, etc.

  app
}
