import { render } from '@testing-library/react';

import { Select } from './select';

describe('Select', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Select options={[{ label: "A", value: "a" }]} onChange={() => undefined} />);
    expect(baseElement).toBeTruthy();
  });
  
});
