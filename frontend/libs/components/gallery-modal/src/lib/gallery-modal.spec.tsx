import { render } from '@testing-library/react';

import GalleryModal from './gallery-modal';

describe('GalleryModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<GalleryModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
