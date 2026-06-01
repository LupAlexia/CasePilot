import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import { Outlet, useNavigate } from 'react-router-dom';

export function MarketingLayout() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'rgba(22, 54, 86, 0.14)', backgroundColor: 'rgba(246,249,253,0.8)' }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            rowGap: { xs: 1.1, sm: 0 },
            py: { xs: 1.25, sm: 0.75 },
            minHeight: { xs: 92, md: 92 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
            <GavelOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ color: 'primary.dark', fontWeight: 800 }}>
              CasePilot
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' }, gap: 1.25 }}>
            <Button
              color="inherit"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ px: 2.75, minHeight: 46, fontSize: '0.96rem', flex: { xs: 1, sm: 'none' } }}
            >
              Autentificare
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 2.9, minHeight: 46, fontSize: '0.96rem', flex: { xs: 1, sm: 'none' } }}
            >
              Înregistrare
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 4.5, md: 7.5 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
