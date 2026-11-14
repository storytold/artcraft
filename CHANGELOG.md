# Changelog

## [Unreleased]

### Added
- WaveSpeed image and video generation with user-provided API keys, account-free
  local history, cloud image import, and restart recovery. See the
  [provider guide](docs/providers/wavespeed.md).

### Security
- Provider downloads reject private-network targets and redirects, and enforce
  response/output bounds. WaveSpeed keys use the operating system credential store.
- Resumable uploads are bound to the verified ArtCraft account. Terminal task
  results cannot be overwritten by late completion updates.
