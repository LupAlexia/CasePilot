import { Chip } from '@mui/material';
import type { CaseStatus } from '../types/case';

interface StatusChipProps {
  status: CaseStatus;
}

const statusConfig: Record<
  CaseStatus,
  { label: string; background: string; color: string }
> = {
  Activ: { label: 'Activ', background: '#DDF1DE', color: '#2B7D46' },
  Amânat: { label: 'Amânat', background: '#F4EDBF', color: '#9A7410' },
  Suspendat: { label: 'Suspendat', background: '#FDEAEA', color: '#B42318' },
  Finalizat: { label: 'Finalizat', background: '#ECEDEF', color: '#586173' }
};

export function StatusChip({ status }: StatusChipProps) {
  const config = statusConfig[status];

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.background,
        color: config.color,
        fontWeight: 700,
        minWidth: 96
      }}
    />
  );
}