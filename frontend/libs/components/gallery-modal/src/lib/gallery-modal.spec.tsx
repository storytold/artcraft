import { render } from '@testing-library/react';

import { GalleryModal } from './gallery-modal';

describe('GalleryModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<GalleryModal mode="view" />);
    expect(baseElement).toBeTruthy();
  });
  
});
