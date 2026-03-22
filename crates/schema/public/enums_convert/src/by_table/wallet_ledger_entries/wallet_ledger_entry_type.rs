use enums_api::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType as Api;
use enums_db::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType as Db;

pub fn wallet_ledger_entry_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Create => Db::Create,
    Api::CreditBanked => Db::CreditBanked,
    Api::CreditMonthly => Db::CreditMonthly,
    Api::DeductMixed => Db::DeductMixed,
    Api::DeductBanked => Db::DeductBanked,
    Api::DeductMonthly => Db::DeductMonthly,
    Api::RefundBanked => Db::RefundBanked,
    Api::StaffAddBanked => Db::StaffAddBanked,
  }
}

pub fn wallet_ledger_entry_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Create => Api::Create,
    Db::CreditBanked => Api::CreditBanked,
    Db::CreditMonthly => Api::CreditMonthly,
    Db::DeductMixed => Api::DeductMixed,
    Db::DeductBanked => Api::DeductBanked,
    Db::DeductMonthly => Api::DeductMonthly,
    Db::RefundBanked => Api::RefundBanked,
    Db::StaffAddBanked => Api::StaffAddBanked,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = wallet_ledger_entry_type_to_db(&api_variant);
      let back = wallet_ledger_entry_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = wallet_ledger_entry_type_to_api(&variant);
      let back = wallet_ledger_entry_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
