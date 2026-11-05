import { render } from '@testing-library/react';

import { ButtonDropdown } from './button-dropdown';

describe('ButtonDropdown', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ButtonDropdown label="Menu" options={[{ label: "One" }]} />);
    expect(baseElement).toBeTruthy();
  });
  
});
