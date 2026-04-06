use tokens::tokens::characters::CharacterToken;

/// Forward-compatible character reference list.
#[derive(Copy, Clone, Debug)]
pub enum CharacterListRef<'a> {
  CharacterTokens(&'a Vec<CharacterToken>),
  
  // In the future, we may have other identifiers for characters.
}
