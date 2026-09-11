import { render } from '@testing-library/react';

import LoginModal from './login-modal';

describe('LoginModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<LoginModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
