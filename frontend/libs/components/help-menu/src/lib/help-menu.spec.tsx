import { render } from '@testing-library/react';

import HelpMenuButton from './help-menu';

describe('HelpMenuButton', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<HelpMenuButton />);
    expect(baseElement).toBeTruthy();
  });
  
});
