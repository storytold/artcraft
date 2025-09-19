import { render } from '@testing-library/react';

import Switch from './switch';

describe('Switch', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Switch />);
    expect(baseElement).toBeTruthy();
  });
  
});
