import { render } from '@testing-library/react';
import { XIcon } from 'lucide-react';

import { ButtonIcon } from './button-icon';

describe('ButtonIcon', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ButtonIcon icon={XIcon} size={16} onClick={() => undefined} />);
    expect(baseElement).toBeTruthy();
  });
  
});
