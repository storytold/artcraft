use actix_cors::Cors;

use crate::util::netlify_branch_domain_matches::netlify_branch_domain_matches;

pub fn add_storyteller_board(cors: Cors, _is_production: bool) -> Cors {
  cors
      // Hypothetical domains
      .allowed_origin("https://memeboard.ai")
      .allowed_origin("https://dingboard.ai")
      .allowed_origin("https://board.storyteller.ai")
      // Netlify project
      .allowed_origin_fn(|origin, _req_head| {
        netlify_branch_domain_matches(origin, "storyteller-board.netlify.app")
      })
      // Local development
      .allowed_origin("http://localhost:5173/")
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
    async fn memeboard() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://memeboard.ai").await;
    }

    #[actix_rt::test]
    async fn dingboard() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://dingboard.ai").await;
    }

    #[actix_rt::test]
    async fn board_dot_storyteller() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://board.storyteller.ai").await;
    }
  }

  mod netlify {
    use super::*;

    #[actix_rt::test]
    async fn netlify_main() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://storyteller-board.netlify.app").await;
    }

    #[actix_rt::test]
    async fn netlify_branch_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://test--storyteller-board.netlify.app").await;
    }

    #[actix_rt::test]
    async fn netlify_deploy_preview() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://deploy-preview-123--storyteller-board.netlify.app").await;
    }

    #[actix_rt::test]
    async fn invalid_netlify_preview_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_invalid(&production_cors, "https://storyteller-board--unrelated.netlify.app").await;
      assert_origin_invalid(&production_cors, "https://deploy-preview-123--unrelated.netlify.app").await;
    }
  }
}
