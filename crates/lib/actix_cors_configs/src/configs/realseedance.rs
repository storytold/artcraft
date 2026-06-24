use actix_cors::Cors;
use crate::util::netlify_branch_domain_matches::netlify_branch_domain_matches;

/// CORS for the "Is That Real Seedance?" website (video-info-website).
pub fn add_realseedance(cors: Cors, _is_production: bool) -> Cors {
  cors
      // Actual domain
      .allowed_origin("https://realseedance.com")
      .allowed_origin("https://www.realseedance.com")
      // Netlify project (bare domain + branch / deploy-preview subdomains)
      .allowed_origin_fn(|origin, _req_head| {
        netlify_branch_domain_matches(origin, "real-seedance.netlify.app")
      })
}
