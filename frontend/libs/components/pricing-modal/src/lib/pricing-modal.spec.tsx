import { render } from '@testing-library/react';

import PricingModal from './pricing-modal';

describe('PricingModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<PricingModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
