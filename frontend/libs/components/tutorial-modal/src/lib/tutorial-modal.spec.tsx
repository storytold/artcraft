import { render } from '@testing-library/react';

import StorytellerUiTutorialModal from './tutorial-modal';

describe('StorytellerUiTutorialModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<StorytellerUiTutorialModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
