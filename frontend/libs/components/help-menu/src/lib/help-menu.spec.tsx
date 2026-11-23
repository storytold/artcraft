import { setLocale } from '@storyteller/i18n';
import { fireEvent, render, screen } from '@testing-library/react';

import HelpMenuButton from './help-menu';

beforeEach(async () => {
  await setLocale('en');
});

describe('HelpMenuButton', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<HelpMenuButton />);
    expect(baseElement).toBeTruthy();
  });

  it('opens the update dialog from Check for Updates', async () => {
    render(<HelpMenuButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Check for Updates…' }));
    expect(await screen.findByRole('dialog', { name: 'Check for Updates' })).toBeTruthy();
  });
  
});
