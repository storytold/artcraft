import { render } from '@testing-library/react';

import ButtonDropdown from './button-dropdown';

describe('ButtonDropdown', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ButtonDropdown />);
    expect(baseElement).toBeTruthy();
  });
  
});
