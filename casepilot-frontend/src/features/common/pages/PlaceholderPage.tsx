import { Box, Paper, Stack, Typography } from '@mui/material';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {title}
      </Typography>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack spacing={1.5} alignItems="center">
          <Typography variant="h4">Secțiune în pregătire</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 700 }}>
            {description}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
