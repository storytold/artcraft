import { render } from '@testing-library/react';

import ButtonIcon from './button-icon';

describe('ButtonIcon', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ButtonIcon />);
    expect(baseElement).toBeTruthy();
  });
  
});
