import { render } from '@testing-library/react';

import Create3dModal from './create-3d-modal';

describe('Create3dModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Create3dModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
