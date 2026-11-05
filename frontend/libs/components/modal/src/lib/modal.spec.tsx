import { render } from '@testing-library/react';

import { Modal } from './modal';

describe('Modal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Modal isOpen={true} onClose={() => undefined}>content</Modal>);
    expect(baseElement).toBeTruthy();
  });
  
});
