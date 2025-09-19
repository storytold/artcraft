import { render } from '@testing-library/react';

import FrontendProviderSetupModal from './provider-setup-modal';

describe('FrontendProviderSetupModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendProviderSetupModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
