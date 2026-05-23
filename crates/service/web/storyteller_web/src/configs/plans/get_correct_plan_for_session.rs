
use chrono::Utc;

use server_environment::ServerEnvironment;

use crate::configs::plans::plan::Plan;
use crate::configs::plans::plan_list::{DEVELOPMENT_PREMIUM_PLANS_BY_SLUG, FREE_LOGGED_IN_PLAN, FREE_LOGGED_OUT_PLAN, LOYALTY_PLANS_BY_SLUG, PRODUCTION_PREMIUM_PLANS_BY_SLUG};
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;

/// Look up the most appropriate plan for the session.
/// This will probably grow to include a lot of factors.
pub fn get_correct_plan_for_session(
  server_environment: ServerEnvironment,
  maybe_user_session: Option<&UserSessionExtended>,
) -> Plan {

  let user_session = match maybe_user_session {
    None => {
      return FREE_LOGGED_OUT_PLAN.clone();
    },
    Some(user_session) => user_session,
  };

  premium_plan_if_available(server_environment, user_session)
      .or_else(|| loyalty_plan_if_available(user_session))
      .unwrap_or(FREE_LOGGED_IN_PLAN.clone())
}

fn premium_plan_if_available(
  server_environment: ServerEnvironment,
  user_session: &UserSessionExtended,
) -> Option<Plan> {

  let now = Utc::now();

  let plan_set = match server_environment {
    ServerEnvironment::Development => &DEVELOPMENT_PREMIUM_PLANS_BY_SLUG,
    ServerEnvironment::Production => &PRODUCTION_PREMIUM_PLANS_BY_SLUG,
  };

  let applicable_plans = user_session.premium.subscription_plans
      .iter()
      .filter(|plan| plan.subscription_expires_at.gt(&now))
      .filter_map(|plan| {
        plan_set.get(&plan.subscription_product_slug)
      })
      .collect::<Vec<&Plan>>();

  // TODO: For now it's only possible for users to have one plan, so we return the first match.
  //  We may need to revisit this if we add additional plans in the future.
  applicable_plans.get(0).map(|plan| (*plan).clone())
}

fn loyalty_plan_if_available(
  user_session: &UserSessionExtended,
) -> Option<Plan> {
  user_session.premium.maybe_loyalty_program_key
      .as_deref()
      .and_then(|loyalty_key| LOYALTY_PLANS_BY_SLUG.get(loyalty_key))
      .map(|plan| plan.clone())
}

#[cfg(test)]
pub mod tests {
  use std::ops::{Add, Sub};

  use chrono::{Duration, Utc};
  use enums::common::payments_namespace::PaymentsNamespace;
  use server_environment::ServerEnvironment;

  use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
  use crate::configs::plans::plan_list::{ALL_PLANS_BY_SLUG, FREE_LOGGED_IN_PLAN, FREE_LOGGED_OUT_PLAN};
  use crate::http_server::session::lookup::user_session_extended::{UserSessionExtended, UserSessionSubscriptionPlan};

  #[test]
  fn test_free_logged_out_plan() {
    let plan = get_correct_plan_for_session(ServerEnvironment::Development, None);
    assert_eq!(plan, *FREE_LOGGED_OUT_PLAN);

    let plan = get_correct_plan_for_session(ServerEnvironment::Production, None);
    assert_eq!(plan, *FREE_LOGGED_OUT_PLAN);
  }

  #[test]
  fn test_free_logged_in_plan() {
    let mut user_session = UserSessionExtended::default();

    user_session.premium.subscription_plans = vec![];
    user_session.premium.maybe_loyalty_program_key = None;

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Development,
      Some(&user_session));

    assert_eq!(plan, *FREE_LOGGED_IN_PLAN);

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    assert_eq!(plan, *FREE_LOGGED_IN_PLAN);
  }

  #[test]
  fn test_loyalty_plan() {
    let mut user_session = UserSessionExtended::default();

    user_session.premium.subscription_plans = vec![];
    user_session.premium.maybe_loyalty_program_key = Some("fakeyou_contributor".to_string());

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Development,
      Some(&user_session));

    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("fakeyou_contributor").unwrap());

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("fakeyou_contributor").unwrap());
  }

  #[test]
  fn test_premium_plan_valid_for_production() {
    let mut user_session = UserSessionExtended::default();

    let future_expiry = Utc::now().add(Duration::days(30));

    user_session.premium.maybe_loyalty_program_key = None;

    user_session.premium.subscription_plans = vec![
      UserSessionSubscriptionPlan {
        subscription_namespace: PaymentsNamespace::FakeYou,
        subscription_product_slug: "fakeyou_plus".to_string(),
        subscription_expires_at: future_expiry,
      }
    ];

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Development,
      Some(&user_session));

    // NB: The user has a "production" plan, which won't show up in development
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("free_logged_in").unwrap());

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    // In production, however, we see the correct plan
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("fakeyou_plus").unwrap());
  }

  #[test]
  fn test_premium_plan_valid_for_development() {
    let mut user_session = UserSessionExtended::default();

    let future_expiry = Utc::now().add(Duration::days(30));

    user_session.premium.maybe_loyalty_program_key = None;

    user_session.premium.subscription_plans = vec![
      UserSessionSubscriptionPlan {
        subscription_namespace: PaymentsNamespace::FakeYou,
        subscription_product_slug: "development_fakeyou_plus".to_string(),
        subscription_expires_at: future_expiry,
      }
    ];

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Development,
      Some(&user_session));

    // NB: In development we see the correct plan
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("development_fakeyou_plus").unwrap());

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    // NB: The user has a "development" plan, which won't show up in production
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("free_logged_in").unwrap());
  }

  #[test]
  fn test_expired_plan_no_longer_returned() {
    let mut user_session = UserSessionExtended::default();

    let already_expired = Utc::now().sub(Duration::days(30));

    user_session.premium.maybe_loyalty_program_key = None;

    user_session.premium.subscription_plans = vec![
      UserSessionSubscriptionPlan {
        subscription_namespace: PaymentsNamespace::FakeYou,
        subscription_product_slug: "fakeyou_plus".to_string(),
        subscription_expires_at: already_expired,
      }
    ];

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Development,
      Some(&user_session));

    // Premium plan is already expired
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("free_logged_in").unwrap());

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    // Premium plan is already expired
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("free_logged_in").unwrap());

    // NB: Just to show that it goes back to premium with a expiry in the future
    let future_expiry = Utc::now().add(Duration::days(30));
    user_session.premium.subscription_plans.get_mut(0).unwrap().subscription_expires_at = future_expiry;

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    // NB: Now it isn't expired!
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("fakeyou_plus").unwrap());
  }

  #[test]
  fn test_premium_plan_preferred_over_loyalty_plan() {
    let mut user_session = UserSessionExtended::default();

    let future_expiry = Utc::now().add(Duration::days(30));

    user_session.premium.maybe_loyalty_program_key = Some("fakeyou_contributor".to_string());

    user_session.premium.subscription_plans = vec![
      UserSessionSubscriptionPlan {
        subscription_namespace: PaymentsNamespace::FakeYou,
        subscription_product_slug: "fakeyou_plus".to_string(),
        subscription_expires_at: future_expiry,
      }
    ];

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Production,
      Some(&user_session));

    // In production we see the premium plan
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("fakeyou_plus").unwrap());

    let plan = get_correct_plan_for_session(
      ServerEnvironment::Development,
      Some(&user_session));

    // NB: The user has a "production" plan, and since this is invalid in development,
    // we see the loyalty plan instead.
    assert_eq!(&plan, ALL_PLANS_BY_SLUG.get("fakeyou_contributor").unwrap());
  }
}
