
#[derive(Copy, Clone, Debug)]
pub enum RequestMismatchMitigationStrategy {
  /// Upgrade the request to pay more.
  PayMoreUpgrade,
  
  /// Downgrade the request to pay less
  PayLessDowngrade,
  
  /// Fail the request.
  ErrorOut,
}
