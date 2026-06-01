import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { appTheme } from '../../../theme/theme';
import { CalendarPage } from './CalendarPage';

// Mock the hearings API so the calendar renders real data in tests
vi.mock('../../../services/api/hearingsApi', () => ({
  getHearings: vi.fn().mockResolvedValue([
    {
      id: 'h1',
      title: 'Termen judecată',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 10, 0, 0).toISOString(),
      courtRoom: '14',
      note: '',
      caseId: 'c1',
      caseNumber: '1234/2024',
      court: 'Tribunal București'
    },
    {
      id: 'h2',
      title: 'Termen judecată',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 18, 14, 30, 0).toISOString(),
      courtRoom: '7',
      note: '',
      caseId: 'c2',
      caseNumber: '5678/2024',
      court: 'Judecătorie Sector 1'
    }
  ])
}));

// Derive expected month/year from today (same logic as CalendarPage)
const now = new Date();
const monthNames = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];
const currentMonthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const nextMonthLabel = `${monthNames[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`;

function renderCalendar() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/app/calendar']}>
        <Routes>
          <Route path="/app/calendar" element={<CalendarPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('CalendarPage', () => {
  it('afișează antetul și evenimentele principale', async () => {
    renderCalendar();

    expect(screen.getByText('Calendar termene')).toBeInTheDocument();
    // Header shows current month after data loads
    expect(await screen.findByText(currentMonthLabel)).toBeInTheDocument();
    expect(screen.getByText(/termene programate/i)).toBeInTheDocument();
    // Hearing data from mock API should appear (in calendar + list = at least 1)
    const tribunalElements = await screen.findAllByText('Tribunal București');
    expect(tribunalElements.length).toBeGreaterThanOrEqual(1);
  });

  it('navighează între luni', async () => {
    const user = userEvent.setup();
    renderCalendar();

    // Wait for initial load
    await screen.findByText(currentMonthLabel);

    await user.click(screen.getByRole('button', { name: /luna următoare/i }));
    expect(await screen.findByText(nextMonthLabel)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /luna anterioară/i }));
    expect(await screen.findByText(currentMonthLabel)).toBeInTheDocument();
  });
});
