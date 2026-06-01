import type { ReactNode } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function StatCard({ icon, title, description }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 4.25 }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ width: 58, height: 58, borderRadius: 3, backgroundColor: 'rgba(31,78,140,0.14)', color: 'primary.dark' }}
          >
            {icon}
          </Stack>
          <Stack spacing={1.25}>
            <Typography variant="h4">{title}</Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
