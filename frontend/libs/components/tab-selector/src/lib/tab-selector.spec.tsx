import { render } from '@testing-library/react';

import TabSelector from './tab-selector';

describe('TabSelector', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<TabSelector />);
    expect(baseElement).toBeTruthy();
  });
  
});
