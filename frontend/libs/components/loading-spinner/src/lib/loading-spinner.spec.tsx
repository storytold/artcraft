import { render } from '@testing-library/react';

import LoadingSpinner from './loading-spinner';

describe('LoadingSpinner', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<LoadingSpinner />);
    expect(baseElement).toBeTruthy();
  });
  
});
