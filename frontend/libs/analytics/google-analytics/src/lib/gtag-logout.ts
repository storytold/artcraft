import { TAG_ID } from './tag-id.js';

export const gtagLogout = function() {
  console.debug("gtagLogout", TAG_ID);

  (window as any).gtag(
    'config', TAG_ID, {
    'user_id': null
  });
}
