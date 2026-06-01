import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { ProfilePage } from './ProfilePage';
import { vi } from 'vitest';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Test User', email: 'test@example.com', roles: ['User'], permissions: [] },
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

vi.mock('../../../services/api/profileApi', () => ({
  getPreferences: () => Promise.resolve({ hearingNotificationsEnabled: false, createdAt: '2026-01-01T00:00:00Z' }),
  updatePreferences: () => Promise.resolve(),
  getSessions: () => Promise.resolve([]),
  updateProfile: () => Promise.resolve({ fullName: 'Test User' }),
  changePassword: () => Promise.resolve(),
  revokeSession: () => Promise.resolve(),
}));

function renderProfile() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/app/profil']}>
        <Routes>
          <Route path="/app/profil" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('ProfilePage', () => {
  it('afișează secțiunile importante din profil', () => {
    renderProfile();

    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText(/date cont/i)).toBeInTheDocument();
    expect(screen.getByText(/reminder termene/i)).toBeInTheDocument();
    expect(screen.getByText(/securitate/i)).toBeInTheDocument();
  });

  it('afișează toggle-ul de reminder termene', async () => {
    renderProfile();

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(1);
    expect(screen.getByText(/reminder termene/i)).toBeInTheDocument();
  });

  it('arată butonul de schimbare parolă', () => {
    renderProfile();
    expect(screen.getByRole('button', { name: /schimbă parola/i })).toBeInTheDocument();
  });
});
