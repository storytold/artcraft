import { render } from '@testing-library/react';

import { CloseButton } from './close-button';

describe('CloseButton', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<CloseButton onClick={() => undefined} />);
    expect(baseElement).toBeTruthy();
  });
  
});
