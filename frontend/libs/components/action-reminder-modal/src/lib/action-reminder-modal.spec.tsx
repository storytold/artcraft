import { render } from '@testing-library/react';

import ActionReminderModal from './action-reminder-modal';

describe('ActionReminderModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<ActionReminderModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
