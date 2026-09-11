import { render } from '@testing-library/react';

import StorytellerMarkdownContent from './markdown-content';

describe('StorytellerMarkdownContent', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<StorytellerMarkdownContent />);
    expect(baseElement).toBeTruthy();
  });
  
});
