import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { StorytellerApiHostStore } from '@storyteller/api';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// In development, route API through the Vite dev server origin to avoid CORS
if (import.meta.env.DEV) {
  try {
    const origin = window.location.origin;
    StorytellerApiHostStore.getInstance().setApiSchemeAndHost(origin);
  } catch (e) {
    console.warn('Failed to set dev API host override', e);
  }
}

root.render(
  <StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </StrictMode>
);