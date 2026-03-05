use actix_cors::Cors;
use crate::util::netlify_branch_domain_matches::netlify_branch_domain_matches;

pub fn add_artcraft_admin_dashboard(cors: Cors, _is_production: bool) -> Cors {
  cors
      .allowed_origin("https://artcraft-dashboard.netlify.app")
      .allowed_origin_fn(|origin, _req_head| {
        netlify_branch_domain_matches(origin, "artcraft-dashboard.netlify.app")
      })
}
