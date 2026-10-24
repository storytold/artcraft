import { render } from '@testing-library/react';

import { Tooltip } from './tooltip';

describe('Tooltip', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Tooltip content="tip" position="top"><span>hover</span></Tooltip>);
    expect(baseElement).toBeTruthy();
  });
  
});
