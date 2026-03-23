use crate::billing_action_fulfillment::artcraft_billing_action::UserCustomerLink;
use enums_db::common::payments_namespace::PaymentsNamespace;
use log::info;
use mysql_queries::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::find_user_stripe_customer_link_using_transaction;
use mysql_queries::queries::users::user_stripe_customer_links::upsert_user_stripe_customer_link::UpsertUserStripeCustomerLink;

pub async fn link_user_to_customer(
  details: &UserCustomerLink,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {

  let maybe_record = find_user_stripe_customer_link_using_transaction(
    &details.user_token,
    PaymentsNamespace::Artcraft,
    transaction
  ).await?;
  
  if maybe_record.is_some() {
    info!("User is already linked to a Stripe customer; skipping link.");
    return Ok(());
  }
  
  let insert = UpsertUserStripeCustomerLink {
    user_token: &details.user_token,
    stripe_customer_id: &details.stripe_customer_id,
    payments_namespace: PaymentsNamespace::Artcraft,
  };
  
  insert.upsert_with_transaction(transaction).await?;

  Ok(())
}
