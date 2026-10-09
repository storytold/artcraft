use artcraft_client::utils::login_challenge_client::{LoginChallengeClientError, LoginRejection};

/// Signup validation fields, in the order they appear on the form.
const FORM_FIELD_ORDER: [&str; 3] = ["username", "email_address", "password"];

/// Turns a rejected `/v1/login` or `/v1/create_account` call into a sentence a
/// user can act on, e.g. "That username is already taken."
pub(super) fn password_auth_error_message(error: &LoginChallengeClientError, is_signup: bool) -> String {
  let Some(status) = error.status else {
    return match error.message {
      "Unable to reach the login server" => {
        "Couldn't reach the ArtCraft servers. Check your internet connection and try again.".to_owned()
      }
      _ => "Something went wrong while signing in. Please try again.".to_owned(),
    };
  };
  if status == 429 {
    return "Too many attempts. Please wait a minute and try again.".to_owned();
  }
  if status >= 500 {
    return "ArtCraft's servers are having trouble right now. Please try again in a few minutes.".to_owned();
  }
  if let Some(message) = error.maybe_rejection.as_ref().and_then(rejection_message) {
    return message;
  }
  match (status, is_signup) {
    (401, false) => "Incorrect username, email, or password.".to_owned(),
    (_, true) => "We couldn't create your account. Please check your details and try again.".to_owned(),
    (_, false) => "We couldn't sign you in. Please check your details and try again.".to_owned(),
  }
}

fn rejection_message(rejection: &LoginRejection) -> Option<String> {
  match rejection.error_type.as_deref() {
    Some("InvalidCredentials") => return Some("Incorrect username, email, or password.".to_owned()),
    Some("AccountNeedsPassword") => {
      return Some(
        "This account doesn't have a password yet. Sign in through the website, or reset your password.".to_owned(),
      )
    }
    _ => {}
  }

  let ordered_fields = FORM_FIELD_ORDER
    .iter()
    .filter_map(|field| rejection.error_fields.get(*field))
    .chain(
      rejection
        .error_fields
        .iter()
        .filter(|(field, _)| !FORM_FIELD_ORDER.contains(&field.as_str()))
        .map(|(_, reason)| reason),
    );
  let field_messages: Vec<String> = ordered_fields.map(|reason| field_reason_message(reason)).collect();
  if !field_messages.is_empty() {
    return Some(field_messages.join(" "));
  }

  match rejection.error_type.as_deref() {
    Some("UsernameTaken") => Some(field_reason_message("username is taken")),
    Some("EmailTaken") => Some(field_reason_message("email is taken")),
    Some("UsernameReserved") => Some(field_reason_message("username is reserved")),
    _ => rejection
      .error_message
      .as_deref()
      .filter(|message| !message.trim().is_empty())
      .map(sentence),
  }
}

/// Server validation reasons are terse lowercase phrases; known ones get a
/// friendlier rewrite, and anything else is shown as a sentence.
fn field_reason_message(reason: &str) -> String {
  let friendly = match reason {
    "username is taken" => "That username is already taken. Please choose another.",
    "username is reserved" | "username contains slurs" => "That username isn't available. Please choose another.",
    "username is too short" => "Usernames must be at least 3 characters.",
    "username is too long" => "Usernames can be at most 16 characters.",
    "invalid username characters" => {
      "Usernames can only contain letters, numbers, underscores (_), and hyphens (-)."
    }
    "email is taken" => "An account with that email already exists. Try logging in instead.",
    "invalid email address" => "Please enter a valid email address.",
    "password is too short" => "Passwords must be at least 6 characters.",
    "passwords do not match" => "Passwords do not match.",
    other => return sentence(other),
  };
  friendly.to_owned()
}

fn sentence(text: &str) -> String {
  let text = text.trim();
  let mut chars = text.chars();
  let mut sentence: String = match chars.next() {
    Some(first) => first.to_uppercase().chain(chars).collect(),
    None => return String::new(),
  };
  if !sentence.ends_with(['.', '!', '?']) {
    sentence.push('.');
  }
  sentence
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeMap;

  use super::*;

  mod signup_tests {
    use super::*;

    #[test]
    fn username_taken() {
      let error = rejected(400, Some("UsernameTaken"), None, &[("username", "username is taken")]);
      assert_eq!(signup_message(&error), "That username is already taken. Please choose another.");
    }

    #[test]
    fn email_taken() {
      let error = rejected(400, Some("EmailTaken"), None, &[("email_address", "email is taken")]);
      assert_eq!(signup_message(&error), "An account with that email already exists. Try logging in instead.");
    }

    #[test]
    fn reserved_username_without_fields_uses_error_type() {
      let error = rejected(400, Some("UsernameReserved"), None, &[]);
      assert_eq!(signup_message(&error), "That username isn't available. Please choose another.");
    }

    #[test]
    fn multiple_bad_fields_follow_form_order() {
      let error = rejected(
        400,
        Some("BadInput"),
        None,
        &[("password", "password is too short"), ("email_address", "invalid email address"), ("username", "invalid username characters")],
      );
      assert_eq!(
        signup_message(&error),
        "Usernames can only contain letters, numbers, underscores (_), and hyphens (-). Please enter a valid email address. Passwords must be at least 6 characters."
      );
    }

    #[test]
    fn unknown_reason_is_shown_as_a_sentence() {
      let error = rejected(400, Some("BadInput"), None, &[("username", "username cannot start with 'user_'")]);
      assert_eq!(signup_message(&error), "Username cannot start with 'user_'.");
    }

    #[test]
    fn unparseable_400_gets_generic_signup_message() {
      let error = status_only(400);
      assert_eq!(signup_message(&error), "We couldn't create your account. Please check your details and try again.");
    }
  }

  mod login_tests {
    use super::*;

    #[test]
    fn invalid_credentials() {
      let error = rejected(401, Some("InvalidCredentials"), Some("invalid credentials"), &[]);
      assert_eq!(login_message(&error), "Incorrect username, email, or password.");
    }

    #[test]
    fn account_needs_password() {
      let error = rejected(401, Some("AccountNeedsPassword"), Some("account was created without a password"), &[]);
      assert_eq!(
        login_message(&error),
        "This account doesn't have a password yet. Sign in through the website, or reset your password."
      );
    }

    #[test]
    fn bare_401_is_treated_as_bad_credentials() {
      assert_eq!(login_message(&status_only(401)), "Incorrect username, email, or password.");
    }
  }

  mod transport_tests {
    use super::*;

    #[test]
    fn rate_limited() {
      assert_eq!(login_message(&status_only(429)), "Too many attempts. Please wait a minute and try again.");
    }

    #[test]
    fn server_error() {
      let error = rejected(500, Some("ServerError"), Some("server error"), &[]);
      assert_eq!(
        signup_message(&error),
        "ArtCraft's servers are having trouble right now. Please try again in a few minutes."
      );
    }

    #[test]
    fn unreachable() {
      let error = LoginChallengeClientError::invalid("Unable to reach the login server");
      assert_eq!(
        login_message(&error),
        "Couldn't reach the ArtCraft servers. Check your internet connection and try again."
      );
    }

    #[test]
    fn messages_never_expose_raw_http_details() {
      for status in [400, 401, 403, 404, 429, 500, 502] {
        for message in [login_message(&status_only(status)), signup_message(&status_only(status))] {
          assert!(!message.contains("HTTP"), "{message}");
          assert!(!message.contains("Some("), "{message}");
          assert!(!message.contains("://"), "{message}");
        }
      }
    }
  }

  fn login_message(error: &LoginChallengeClientError) -> String {
    password_auth_error_message(error, false)
  }

  fn signup_message(error: &LoginChallengeClientError) -> String {
    password_auth_error_message(error, true)
  }

  fn status_only(status: u16) -> LoginChallengeClientError {
    LoginChallengeClientError {
      status: Some(status),
      message: "Login server rejected the request",
      maybe_rejection: None,
    }
  }

  fn rejected(
    status: u16,
    error_type: Option<&str>,
    error_message: Option<&str>,
    error_fields: &[(&str, &str)],
  ) -> LoginChallengeClientError {
    LoginChallengeClientError {
      maybe_rejection: Some(LoginRejection {
        error_type: error_type.map(str::to_owned),
        error_message: error_message.map(str::to_owned),
        error_fields: error_fields
          .iter()
          .map(|(field, reason)| (field.to_string(), reason.to_string()))
          .collect::<BTreeMap<_, _>>(),
      }),
      ..status_only(status)
    }
  }
}
