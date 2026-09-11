import { render } from '@testing-library/react';

import MenuIconSelector from './menu-icon-selector';

describe('MenuIconSelector', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<MenuIconSelector />);
    expect(baseElement).toBeTruthy();
  });
  
});
