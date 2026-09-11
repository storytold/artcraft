


pub (super) const WORLDLABS_JAVASCRIPT_EXPORT_BEARER_TOKENS : &str = r#"
    (async () => {
      if (window.tokensExported) {
        return;
      }

      const request = indexedDB.open("firebaseLocalStorageDb");

      request.onerror = (event) => {};

      request.onsuccess = (event) => {
        const db = event.target.result;

        const tx = db.transaction("firebaseLocalStorage", "readonly");
        const store = tx.objectStore("firebaseLocalStorage");

        const keysRequest = store.getAllKeys();

        keysRequest.onerror = (event) => {};

        keysRequest.onsuccess = () => {
          const keys = keysRequest.result; // array of keys
          if (keys.length < 1) {
            return;
          }

          const key = keys[0];
          const getKeyRequest = store.getKey(key);

          getKeyRequest.onsuccess = () => {};

          store.openCursor().onsuccess = async (event) => {
            const cursor = event.target.result;

            if (cursor) {
              let tokens = cursor.value?.value?.stsTokenManager;

              if (tokens?.accessToken && tokens?.refreshToken) {
                // Send to Tauri
                let result = await window.__TAURI__.core.invoke("worldlabs_receive_bearer_command", {
                  request: {
                    bearer_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                  }
                });
                window.tokensExported = true;
              }
              cursor.continue();
            }
          }; // end cursor

        }; // end keyRequest
      }; // end DB
    })();
  "#;


/// Take the Bearer tokens and send them to Tauri
pub (super) const WORLDLABS_JAVASCRIPT_SEND_BEARER_TO_TAURI : &str = r#"
    (async () => {
      if (!(window.tokens?.accessToken && window.tokens?.refreshToken)) {
        return;
      }

      let result = await window.__TAURI__.core.invoke("worldlabs_receive_bearer_command", {
        request: {
          bearer_token: window.tokens.accessToken,
          refresh_token: window.tokens.refreshToken,
        }
      });

      error.log('>>> result', result);

    })();
  "#;


/// See if the pricing button exists.
/// This is only for the logged-in state.
/// We can use redirection to detect completion.
pub (super) const WORLDLABS_JAVASCRIPT_SEE_IF_PRICING_EXISTS : &str = r#"
    (() => {
      let pricing = document.querySelectorAll("a[href='/pricing']");
      if (pricing.length > 0) {
        window.location.href = "https://www.worldlabs.ai/about";
      }
    })();
  "#;
