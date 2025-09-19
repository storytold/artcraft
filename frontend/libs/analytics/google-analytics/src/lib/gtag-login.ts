import { TAG_ID } from './tag-id.js';

export const gtagLogin = function(userToken: string) {
  console.debug("gtagLogin", TAG_ID, userToken);

  (window as any).gtag(
    'config', TAG_ID, {
    'user_id': userToken
  });
}
