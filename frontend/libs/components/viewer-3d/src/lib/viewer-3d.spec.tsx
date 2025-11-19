import { render } from '@testing-library/react';

import StorytellerUiViewer3d from './viewer-3d';

describe('StorytellerUiViewer3d', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<StorytellerUiViewer3d />);
    expect(baseElement).toBeTruthy();
  });
  
});
