import { fireEvent, render, screen } from '@testing-library/react';

import HelpMenuButton from './help-menu';

describe('HelpMenuButton', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<HelpMenuButton />);
    expect(baseElement).toBeTruthy();
  });
  
  it('opens the update dialog from Help', async () => {
    render(<HelpMenuButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    fireEvent.click(await screen.findByText('Check for Updates…'));
    expect(await screen.findByRole('dialog', { name: 'Check for Updates' }, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText('The web app updates when you reload. Open Releases to get the desktop app.')).toBeTruthy();
  });
});
