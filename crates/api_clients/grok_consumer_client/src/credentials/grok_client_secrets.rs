use crate::datatypes::api::baggage::Baggage;
use crate::datatypes::api::sentry_trace::SentryTrace;
use crate::datatypes::api::svg_path_data::SvgPathData;
use crate::datatypes::api::user_email::UserEmail;
use crate::datatypes::api::user_id::UserId;
use crate::datatypes::api::verification_token::VerificationToken;
use crate::datatypes::api::xsid_numbers::XsidNumbers;

#[derive(Clone)]
pub struct GrokClientSecrets {
  /// Baggage is <meta> tag data from the index.html
  pub baggage: Baggage,

  /// Baggage is <meta> tag data from the index.html
  pub sentry_trace: SentryTrace,

  /// Baggage is <meta> tag data from the index.html
  pub verification_token: VerificationToken,

  /// The SVG path data to use (chosen via verification_token)
  /// We selected one of four-ish possible SVG paths (of length >= 200) by
  /// the `verification token -> animation index` algo.
  pub svg_path_data: SvgPathData,

  /// This doesn't come from the index.html
  /// These numbers are separately loaded from the xsid javascript
  pub numbers: XsidNumbers,

  /// From index.html
  /// Not strictly needed to sign requests, but typically needed to generate URLs.
  pub user_id: UserId,

  /// From index.html
  /// Not needed, but returned alongside other details.
  pub user_email: Option<UserEmail>,
}
