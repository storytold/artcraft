import { render } from '@testing-library/react';

import DemoModal from './demo-modal';

describe('DemoModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<DemoModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
