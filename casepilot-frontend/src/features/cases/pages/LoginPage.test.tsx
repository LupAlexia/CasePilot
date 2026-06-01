import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { LoginPage } from './LoginPage';
import { vi } from 'vitest';

// Mock the authApi module
vi.mock('../../../services/api/authApi', () => ({
  loginStep1: vi.fn().mockResolvedValue({
    requiresVerification: true,
    verificationToken: 'test-token',
    maskedEmail: 't***t@test.com',
    loginData: null,
  }),
}));

function renderLogin() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-code" element={<div>Verify Code Page</div>} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('LoginPage', () => {
  it('afișează conținutul de bază al formularului', () => {
    renderLogin();

    expect(screen.getByText(/bine ai venit în casepilot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parolă/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /autentificare/i })).toBeInTheDocument();
  });

  it('navighează către pagina de verificare cod la submit', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@exemplu.ro');
    await user.type(screen.getByLabelText(/parolă/i), 'Parola123!');
    await user.click(screen.getByRole('button', { name: /autentificare/i }));

    expect(screen.getByText('Verify Code Page')).toBeInTheDocument();
  });

  it('navighează către înregistrare din link', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /creează cont/i }));

    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });

  it('navighează către pagina de recuperare parolă', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /ai uitat parola/i }));

    expect(screen.getByText('Forgot Password Page')).toBeInTheDocument();
  });
});
