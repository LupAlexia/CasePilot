import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';

interface InfoItemProps {
  label: string;
  value: ReactNode;
}

export function InfoItem({ label, value }: InfoItemProps) {
  return (
    <Stack spacing={0.5}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ fontSize: '1.1rem' }}>
        {value}
      </Typography>
    </Stack>
  );
}
