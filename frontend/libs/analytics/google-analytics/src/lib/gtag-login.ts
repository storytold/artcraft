
// Google Analytics disabled (privacy). Kept as a no-op so existing call sites compile.
// Previously this sent the user's session token to Google Analytics as user_id.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const gtagLogin = function(_userToken: string) {
  // no-op
}
