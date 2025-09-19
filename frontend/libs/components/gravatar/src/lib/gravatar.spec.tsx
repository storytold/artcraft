import { render } from '@testing-library/react';

import Gravatar from './gravatar';

describe('Gravatar', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Gravatar />);
    expect(baseElement).toBeTruthy();
  });
  
});
