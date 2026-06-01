import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../theme/theme';
import { MarketingLayout } from './MarketingLayout';
import { WorkspaceLayout } from './WorkspaceLayout';
import { vi } from 'vitest';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Test User', email: 'test@example.com', roles: ['User'], permissions: [] },
    logout: vi.fn(),
    isAdmin: false,
    hasPermission: () => true
  }),
}));

function wrapWithTheme(ui: ReactElement) {
  return <ThemeProvider theme={appTheme}>{ui}</ThemeProvider>;
}

describe('MarketingLayout', () => {
  it('afișează brandul și navighează din butoane', async () => {
    const user = userEvent.setup();

    render(
      wrapWithTheme(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<MarketingLayout />}>
              <Route index element={<div>Landing</div>} />
            </Route>
            <Route path="/login" element={<div>Login</div>} />
            <Route path="/register" element={<div>Register</div>} />
          </Routes>
        </MemoryRouter>
      )
    );

    expect(screen.getByText('CasePilot')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /autentificare/i }));
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('navighează și din butonul înregistrare', async () => {
    const user = userEvent.setup();

    render(
      wrapWithTheme(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<MarketingLayout />}>
              <Route index element={<div>Landing</div>} />
            </Route>
            <Route path="/login" element={<div>Login</div>} />
            <Route path="/register" element={<div>Register</div>} />
          </Routes>
        </MemoryRouter>
      )
    );

    await user.click(screen.getByRole('button', { name: /înregistrare/i }));
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
});

describe('WorkspaceLayout', () => {
  it('afișează meniul și schimbă ruta la click pe item', async () => {
    const user = userEvent.setup();

    render(
      wrapWithTheme(
        <MemoryRouter initialEntries={['/app/dosare']}>
          <Routes>
            <Route path="/app" element={<WorkspaceLayout />}>
              <Route path="dosare" element={<div>Pagina Dosare</div>} />
              <Route path="calendar" element={<div>Pagina Calendar</div>} />
              <Route path="dashboard" element={<div>Pagina Dashboard</div>} />
              <Route path="asistent-ai" element={<div>Pagina AI</div>} />
              <Route path="profil" element={<div>Pagina Profil</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
    );

    expect(screen.getByText('Pagina Dosare')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /calendar/i }));
    expect(screen.getByText('Pagina Calendar')).toBeInTheDocument();
  });
});
