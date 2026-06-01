import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { RegisterPage } from './RegisterPage';
import { vi } from 'vitest';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

vi.mock('../../../services/api/authApi', () => ({
  registerUser: vi.fn().mockResolvedValue({
    id: '123',
    email: 'ion@exemplu.ro',
    fullName: 'Ion Popescu',
    roles: ['User'],
    permissions: [],
    accessToken: 'test-token',
    refreshToken: 'test-refresh'
  }),
}));

function renderRegister() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app" element={<div>Dashboard Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('RegisterPage', () => {
  it('afișează formularul complet de înregistrare', () => {
    renderRegister();

    expect(screen.getByText(/creează un cont nou/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nume/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^parolă/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmare parolă/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creează cont/i })).toBeInTheDocument();
  });

  it('navighează către dashboard la submit', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nume/i), 'Ion Popescu');
    await user.type(screen.getByLabelText(/email/i), 'ion@exemplu.ro');
    await user.type(screen.getByLabelText(/^parolă/i), 'Parola123!');
    await user.type(screen.getByLabelText(/confirmare parolă/i), 'Parola123!');
    await user.click(screen.getByRole('button', { name: /creează cont/i }));

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('navighează către login din link', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(screen.getByRole('button', { name: /autentificare/i }));

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
