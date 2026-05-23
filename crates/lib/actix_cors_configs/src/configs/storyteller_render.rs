use actix_cors::Cors;

use crate::util::netlify_branch_domain_matches::netlify_branch_domain_matches;

pub fn add_storyteller_render(cors: Cors, _is_production: bool) -> Cors {
  cors
      // Hypothetical domains
      .allowed_origin("https://render.storyteller.ai")
      // Netlify project
      .allowed_origin_fn(|origin, _req_head| {
        netlify_branch_domain_matches(origin, "storyteller-render.netlify.app")
      })
}

#[cfg(test)]
mod tests {
  use server_environment::ServerEnvironment;

  use crate::cors::build_cors_config;
  use crate::testing::assert_origin_invalid;
  use crate::testing::assert_origin_ok;

  mod domains {
    use super::*;

    #[actix_rt::test]
    async fn board_dot_storyteller() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://render.storyteller.ai").await;
    }
  }

  mod netlify {
    use super::*;

    #[actix_rt::test]
    async fn netlify_main() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://storyteller-render.netlify.app").await;
    }

    #[actix_rt::test]
    async fn netlify_branch_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://test--storyteller-render.netlify.app").await;
    }

    #[actix_rt::test]
    async fn netlify_deploy_preview() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://deploy-preview-123--storyteller-render.netlify.app").await;
    }

    #[actix_rt::test]
    async fn invalid_netlify_preview_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_invalid(&production_cors, "https://storyteller-render--unrelated.netlify.app").await;
      assert_origin_invalid(&production_cors, "https://deploy-preview-123--unrelated.netlify.app").await;
    }
  }
}
