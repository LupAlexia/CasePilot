import { Card, CardContent, Stack, Typography } from '@mui/material';
import type { PropsWithChildren, ReactNode } from 'react';

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'center', md: 'flex-start' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2.5, textAlign: { xs: 'center', md: 'left' } }}
        >
          <Stack spacing={0.75}>
            <Typography variant="h4">{title}</Typography>
            {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
          </Stack>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}
