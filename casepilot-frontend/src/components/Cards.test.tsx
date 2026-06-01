import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import type { ReactElement } from 'react';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import { appTheme } from '../theme/theme';
import { SectionCard } from './SectionCard';
import { StatCard } from './StatCard';

function wrap(ui: ReactElement) {
  return render(<ThemeProvider theme={appTheme}>{ui}</ThemeProvider>);
}

describe('SectionCard', () => {
  it('afișează titlu, subtitlu, acțiune și conținut', () => {
    wrap(
      <SectionCard title="Titlu" subtitle="Subtitlu" action={<button>Acțiune</button>}>
        <div>Conținut</div>
      </SectionCard>
    );

    expect(screen.getByText('Titlu')).toBeInTheDocument();
    expect(screen.getByText('Subtitlu')).toBeInTheDocument();
    expect(screen.getByText('Acțiune')).toBeInTheDocument();
    expect(screen.getByText('Conținut')).toBeInTheDocument();
  });

  it('randă corect și fără subtitlu', () => {
    wrap(
      <SectionCard title="Doar titlu">
        <div>Body</div>
      </SectionCard>
    );

    expect(screen.getByText('Doar titlu')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.queryByText('Subtitlu')).not.toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('afișează icon, titlu și descriere', () => {
    wrap(<StatCard icon={<GavelOutlinedIcon />} title="Stat" description="Descriere" />);

    expect(screen.getByText('Stat')).toBeInTheDocument();
    expect(screen.getByText('Descriere')).toBeInTheDocument();
  });
});
