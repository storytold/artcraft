import { render } from '@testing-library/react';

import { TabSelector } from './tab-selector';

describe('TabSelector', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<TabSelector tabs={[{ id: "a", label: "A" }]} activeTab="a" onTabChange={() => undefined} />);
    expect(baseElement).toBeTruthy();
  });
  
});
