import { render } from '@testing-library/react';

import LightboxModal from './lightbox-modal';

describe('LightboxModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<LightboxModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
