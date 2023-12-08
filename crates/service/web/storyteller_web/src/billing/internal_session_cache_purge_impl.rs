use actix_web::HttpRequest;

#[cfg(feature = "billing")]
use billing_component::stripe::traits::internal_session_cache_purge::InternalSessionCachePurge;
use redis_caching::redis_ttl_cache::RedisTtlCache;
use redis_common::redis_cache_keys::RedisCacheKeys;
use users_component::utils::session_checker::SessionChecker;

pub struct InternalSessionCachePurgeImpl {
  session_checker: SessionChecker,
  redis_ttl_cache: RedisTtlCache,
}

impl InternalSessionCachePurgeImpl {
  pub fn new(session_checker: SessionChecker, redis_ttl_cache: RedisTtlCache) -> Self {
    Self {
      session_checker,
      redis_ttl_cache,
    }
  }
}

#[cfg(feature = "billing")]
impl InternalSessionCachePurge for InternalSessionCachePurgeImpl {
  fn best_effort_purge_session_cache(&self, http_request: &HttpRequest) {
    // TODO: Clear Redis cache of sessions
    //  Unfortunately we don't yet have an index of user_token => session_tokens[] outside the DB.
    //  For now, a hacky solution is just to delete the cache under the current user.
    //  This makes sense for non-mods and should solve 95% of cases.
    if let Some(session_token) = self.session_checker.forgiving_get_session_token(&http_request) {
      if let Ok(mut redis_ttl_cache) = self.redis_ttl_cache.get_connection() {
        let keys = vec![
          RedisCacheKeys::session_record_user(&session_token),
          RedisCacheKeys::session_record_light(&session_token),
        ];
        for key in keys.iter() {
          let _r = redis_ttl_cache.delete_from_cache(key).ok();
        }
      }
    }
  }
}
