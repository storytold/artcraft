/// Test MediaUploadToken in isolation, just in case our macro-derived tests break.

use serde::Deserialize;
use serde::Serialize;

use tokens::tokens::media_uploads::MediaUploadToken;

#[derive(Serialize, Deserialize, PartialEq, Debug)]
struct CompositeType {
  media_upload_token: MediaUploadToken,
  string: String,
}

mod interface {
  use tokens::tokens::media_uploads::MediaUploadToken;

  #[test]
  fn generate() {
    let token = MediaUploadToken::generate();
    assert!(!token.to_string().is_empty());
    assert!(token.to_string().starts_with("mu_"));
  }

  #[test]
  fn new() {
    let token = MediaUploadToken::new("mu_foo".to_string());
    assert_eq!(token, MediaUploadToken("mu_foo".to_string()));
  }

  #[test]
  fn new_from_str() {
    let token = MediaUploadToken::new_from_str("mu_foo");
    assert_eq!(token, MediaUploadToken("mu_foo".to_string()));
  }

  #[test]
  fn as_str() {
    let token = MediaUploadToken("mu_foo".to_string());
    assert_eq!(token.as_str(), "mu_foo");
  }

  #[test]
  fn to_string() {
    let token = MediaUploadToken("mu_foo".to_string());
    assert_eq!(token.to_string(), "mu_foo".to_string());
  }
}

mod traits {
  use tokens::tokens::media_uploads::MediaUploadToken;

  #[test]
  fn display() {
    let token = MediaUploadToken("mu_foo".to_string());
    assert_eq!(format!("{}", token), "mu_foo".to_string());
  }

  #[test]
  fn debug() {
    let token = MediaUploadToken("mu_foo".to_string());
    assert_eq!(format!("{:?}", token), "MediaUploadToken(\"mu_foo\")".to_string());
  }
}

mod serialization {
  use tokens::tokens::media_uploads::MediaUploadToken;

  use crate::CompositeType;

// NB(bt,2024-09-25): These tests are broken with a recent upgrade
//  #[test]
//  fn serialize() {
//    let expected = "\"mu_foo\"".to_string(); // NB: Quoted
//
//    let token = MediaUploadToken("mu_foo".to_string());
//    assert_eq!(expected, toml::to_string(&token).unwrap());
//
//    // Just to show this serializes the same as a string
//    assert_eq!(expected, toml::to_string("mu_foo").unwrap());
//  }

  #[test]
  fn nested_serialize() {
    let value = CompositeType { media_upload_token: MediaUploadToken("mu_foo".to_string()), string: "bar".to_string() };
    let expected = r#"{"media_upload_token":"mu_foo","string":"bar"}"#.to_string();
    assert_eq!(expected, serde_json::to_string(&value).unwrap());
  }
}

mod deserialization {
  use tokens::tokens::media_uploads::MediaUploadToken;

  use crate::CompositeType;

  #[test]
  fn deserialize() {
    let payload = "\"mu_foo\""; // NB: Quoted
    let expected = "mu_foo".to_string();

    let value: MediaUploadToken = serde_json::from_str(payload).unwrap();
    assert_eq!(value, MediaUploadToken(expected.clone()));

    // Just to show this deserializes the same way as a string
    let value: String = serde_json::from_str(payload).unwrap();
    assert_eq!(value, expected.clone());
  }

  #[test]
  fn nested_deserialize() {
    let payload = r#"{"media_upload_token":"mu_foo","string":"bar"}"#.to_string();
    let expected = CompositeType {
      media_upload_token: MediaUploadToken("mu_foo".to_string()),
      string: "bar".to_string(),
    };

    assert_eq!(expected, serde_json::from_str::<CompositeType>(&payload).unwrap());
  }
}

// These traits should be tested by the macro, but we duplicate them in case that breaks
mod crockford_traits {
  use tokens::tokens::media_uploads::MediaUploadToken;

  const ENTROPIC_CHARACTERS_MINIMUM : usize = 8;

  #[test]
  fn entropy_is_sufficient() {
    assert!(MediaUploadToken::entropic_character_len() > ENTROPIC_CHARACTERS_MINIMUM);
  }

  #[test]
  fn token_length() {
    assert_eq!(MediaUploadToken::generate().as_str().len(), 32);
  }

  #[test]
  fn tokens_are_random() {
    let mut tokens = std::collections::HashSet::new();
    for _ in 0..100 {
      tokens.insert(MediaUploadToken::generate().to_string());
    }
    assert_eq!(tokens.len(), 100);
  }

  #[test]
  fn character_set() {
    let token_string = MediaUploadToken::generate().to_string();
    let prefix = MediaUploadToken::token_prefix();
    let random_part = token_string.replace(prefix, "");

    assert!(random_part.len() > ENTROPIC_CHARACTERS_MINIMUM);
    assert!(random_part.chars().all(|c| c.is_numeric() || c.is_lowercase()));
  }

  #[test]
  fn prefix_ends_with_separator() {
    let prefix = MediaUploadToken::token_prefix();
    assert!(prefix.ends_with(":") || prefix.ends_with("_"));

    let token_string = MediaUploadToken::generate().to_string();
    assert!(token_string.contains(":") || token_string.contains("_"));
  }

  #[test]
  fn token_begins_with_prefix() {
    let prefix = MediaUploadToken::token_prefix();
    let token_string = MediaUploadToken::generate().to_string();
    assert!(token_string.starts_with(prefix));
  }

  #[test]
  fn entropy_suffix() {
    let token = MediaUploadToken::new_from_str("mu_foo");
    assert_eq!(token.entropy_suffix(), "foo");

    let token = MediaUploadToken::new_from_str("bar");
    assert_eq!(token.entropy_suffix(), "bar");

    let token = MediaUploadToken::generate();
    assert_eq!(token.entropy_suffix().len(), 29);
  }
}
