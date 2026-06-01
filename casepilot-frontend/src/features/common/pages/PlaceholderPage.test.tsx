import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { appTheme } from '../../../theme/theme';
import { PlaceholderPage } from './PlaceholderPage';

describe('PlaceholderPage', () => {
  it('afișează titlu, stare și descriere', () => {
    render(
      <ThemeProvider theme={appTheme}>
        <PlaceholderPage title="Calendar" description="Descriere calendar" />
      </ThemeProvider>
    );

    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText(/secțiune în pregătire/i)).toBeInTheDocument();
    expect(screen.getByText('Descriere calendar')).toBeInTheDocument();
  });
});
