use tokens::tokens::characters::CharacterToken;

/// Forward-compatible character reference list.
#[derive(Clone, Debug)]
pub enum CharacterListRef {
  CharacterTokens(Vec<CharacterToken>),

  // In the future, we may have other identifiers for characters.
}
