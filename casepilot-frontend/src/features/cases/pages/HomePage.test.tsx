import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { HomePage } from './HomePage';

function renderHome() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('HomePage', () => {
  it('afișează secțiunile principale', () => {
    renderHome();

    expect(screen.getByText(/control total asupra dosarelor/i)).toBeInTheDocument();
    expect(screen.getByText(/construit pentru rigoarea juridică/i)).toBeInTheDocument();
    expect(screen.getByText(/costul ascuns al gestionării manuale/i)).toBeInTheDocument();
    expect(screen.getByText(/preia controlul asupra activității tale juridice/i)).toBeInTheDocument();
  });

  it('navighează către login din CTA', async () => {
    const user = userEvent.setup();
    renderHome();

    const startButtons = screen.getAllByRole('button', { name: /începe acum/i });
    await user.click(startButtons[0]);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('navighează și din CTA-ul final de jos', async () => {
    const user = userEvent.setup();
    renderHome();

    const startButtons = screen.getAllByRole('button', { name: /începe acum/i });
    await user.click(startButtons[startButtons.length - 1]);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('apelează scrollIntoView pentru butonul Ce oferim', async () => {
    const user = userEvent.setup();
    const scrollSpy = vi.fn();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollSpy
    });

    renderHome();

    await user.click(screen.getByRole('button', { name: /ce oferim/i }));

    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });
});
