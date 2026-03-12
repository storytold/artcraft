import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import * as ReactDOM from 'react-dom/client';
import { StorytellerApiHostStore } from '@storyteller/api';
import App from './app/app';

// In dev mode, route API calls through Vite origin to avoid CORS
if (import.meta.env.DEV) {
  StorytellerApiHostStore.getInstance().setApiSchemeAndHost(
    window.location.origin,
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
