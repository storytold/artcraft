import { render } from '@testing-library/react';
import { vi } from 'vitest';

// The modal subscribes to a Tauri event on mount. There is no Tauri runtime under jsdom
// (window.__TAURI_INTERNALS__ is undefined), so replace `listen` with a stub that resolves to
// an "unlisten" function, the same shape the real one returns.
const listen = vi.hoisted(() => vi.fn(() => Promise.resolve(() => undefined)));
vi.mock('@tauri-apps/api/event', () => ({ listen }));

import FrontendProviderBillingModal from './provider-billing-modal';

describe('FrontendProviderBillingModal', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendProviderBillingModal />);
    expect(baseElement).toBeTruthy();
  });

  it('listens for the show-billing-modal event while mounted', () => {
    render(<FrontendProviderBillingModal />);
    expect(listen).toHaveBeenCalledWith('show_provider_billing_modal_event', expect.any(Function));
  });
});
