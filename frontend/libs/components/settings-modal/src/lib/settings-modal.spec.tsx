import { render } from '@testing-library/react';

import SettingsModal from './settings-modal';

describe('SettingsModal', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<SettingsModal />);
    expect(baseElement).toBeTruthy();
  });
  
});
