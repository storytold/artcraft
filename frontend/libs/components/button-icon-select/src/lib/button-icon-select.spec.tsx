import { render } from '@testing-library/react';
import { XIcon } from 'lucide-react';

import { ButtonIconSelect } from './button-icon-select';

describe('ButtonIconSelect', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ButtonIconSelect options={[{ value: "a", icon: XIcon }]} />);
    expect(baseElement).toBeTruthy();
  });
  
});
