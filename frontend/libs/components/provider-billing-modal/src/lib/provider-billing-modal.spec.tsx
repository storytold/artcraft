import { render } from '@testing-library/react';

import FrontendProviderBillingModal from './provider-billing-modal';

describe('FrontendProviderBillingModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendProviderBillingModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
