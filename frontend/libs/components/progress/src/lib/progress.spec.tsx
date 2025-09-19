import { render } from '@testing-library/react';

import StorytellerUiProgress from './progress';

describe('StorytellerUiProgress', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<StorytellerUiProgress />);
    expect(baseElement).toBeTruthy();
  });
  
});
