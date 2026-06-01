import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCookieConsent, setCookieConsent, trackPageView } from '../lib/userMonitoring';

export function CookieConsentBanner() {
  const [consent, setConsent] = useState(getCookieConsent());

  if (consent) return null;

  const handleChoice = (value: 'accepted' | 'rejected') => {
    setCookieConsent(value);
    setConsent(value);

    if (value === 'accepted') {
      trackPageView(window.location.pathname);
    }
  };

  return (
    <AnimatePresence>
      {!consent && (
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          sx={{
            position: 'fixed',
            left: { xs: 12, md: 20 },
            right: { xs: 12, md: 20 },
            bottom: { xs: 12, md: 20 },
            zIndex: 1400,
            p: { xs: 2, md: 2.5 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 30px rgba(0,0,0,0.16)'
          }}
        >
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Preferințe cookie
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                Folosim cookie-uri pentru a monitoriza activitatea în aplicație și a memora preferințele tale (ex: tab-uri, notificări).
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ minWidth: { md: 320 } }}>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                variant="outlined"
                color="inherit"
                onClick={() => handleChoice('rejected')}
              >
                Respinge
              </Button>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                variant="contained"
                onClick={() => handleChoice('accepted')}
              >
                Acceptă cookie-uri
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </AnimatePresence>
  );
}
