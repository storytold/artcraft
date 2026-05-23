use actix_cors::Cors;

use crate::util::netlify_branch_domain_matches::netlify_branch_domain_matches;

pub fn add_storyteller_studio(cors: Cors, _is_production: bool) -> Cors {
  cors.allowed_origin("https://studio.storyteller.ai")
      .allowed_origin("https://studio-staging.studio.storyteller.ai")
      .allowed_origin("https://studio-testing.studio.storyteller.ai")
      .allowed_origin_fn(|origin, _req_head| {
        netlify_branch_domain_matches(origin, "storytellerstudio.netlify.app")
      })
      .allowed_origin_fn(|origin, _req_head| {
        netlify_branch_domain_matches(origin, "pipeline-gottagofast.netlify.app")
      })
      .allowed_origin("http://localhost:5173")
      .allowed_origin("https://animate.storyteller.ai") // NB: Gen2 Studio
}

#[cfg(test)]
mod tests {
  use server_environment::ServerEnvironment;

  use crate::cors::build_cors_config;
  use crate::testing::assert_origin_invalid;
  use crate::testing::assert_origin_ok;

  mod gotta_go_fast {
    use super::*;

    #[actix_rt::test]
    async fn gotta_go_fast_main() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://pipeline-gottagofast.netlify.app").await;
    }

    #[actix_rt::test]
    async fn gotta_go_fast_branch_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://test--pipeline-gottagofast.netlify.app").await;
    }

    #[actix_rt::test]
    async fn gotta_go_fast_deploy_preview() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://deploy-preview-86--pipeline-gottagofast.netlify.app").await;
    }

    #[actix_rt::test]
    async fn invalid_netlify_preview_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_invalid(&production_cors, "https://deploy-preview-86--unrelated-project.netlify.app").await;
    }
  }

  mod studio {
    use super::*;

    #[actix_rt::test]
    async fn studio_main() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://studio.storyteller.ai").await;
      assert_origin_invalid(&production_cors, "https://studiofake.storyteller.ai").await;
    }

    #[actix_rt::test]
    async fn studio_staging() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://studio-staging.studio.storyteller.ai").await;
      assert_origin_invalid(&production_cors, "https://studio-staging-fake.studio.storyteller.ai").await;
    }

    #[actix_rt::test]
    async fn studio_testing() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://studio-testing.studio.storyteller.ai").await;
      assert_origin_invalid(&production_cors, "https://studio-testing-fake.studio.storyteller.ai").await;
    }

    #[actix_rt::test]
    async fn studio_netlify() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://storytellerstudio.netlify.app").await;
      assert_origin_invalid(&production_cors, "https://storytellerstudiofake.netlify.app").await;
    }

    #[actix_rt::test]
    async fn studio_netlify_branch_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://foo--storytellerstudio.netlify.app").await;
    }

    #[actix_rt::test]
    async fn studio_netlify_deploy_preview() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://deploy-preview-123--storytellerstudio.netlify.app").await;
    }

    #[actix_rt::test]
    async fn invalid_netlify_preview_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_invalid(&production_cors, "https://fakestorytellerstudio.netlify.app").await;
      assert_origin_invalid(&production_cors, "https://deploy-preview-86--fakestorytellerstudio.netlify.app").await;
    }
  }
}
