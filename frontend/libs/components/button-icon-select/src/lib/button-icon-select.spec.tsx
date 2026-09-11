import { render } from '@testing-library/react';

import ButtonIconSelect from './button-icon-select';

describe('ButtonIconSelect', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ButtonIconSelect />);
    expect(baseElement).toBeTruthy();
  });
  
});
