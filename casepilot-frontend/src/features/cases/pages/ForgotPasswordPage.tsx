import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal, scaleIn } from '../../../lib/animations';
import { forgotPassword } from '../../../services/api/authApi';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(160deg, rgba(238,243,249,0.96) 0%, rgba(221,232,245,0.95) 100%), radial-gradient(980px 380px at 100% -40%, rgba(31,78,140,0.16), transparent 70%)'
      }}
    >
      <Box
        component={motion.div}
        aria-hidden
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={
          shouldReduceMotion
            ? undefined
            : { opacity: [0.2, 0.35, 0.2], scale: [1, 1.05, 1] }
        }
        transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          width: { xs: 200, md: 300 },
          height: { xs: 200, md: 300 },
          top: { xs: -50, md: -60 },
          left: { xs: -40, md: -30 },
          background: 'radial-gradient(circle at 60% 40%, rgba(245,124,0,0.14), rgba(245,124,0,0.02))',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(2px)'
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <Paper
          component={motion.div}
          initial="hidden"
          animate="visible"
          variants={cardReveal}
          sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3.5 }}
        >
          <Stack
            component={motion.div}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            spacing={3}
          >
            <Stack
              component={motion.div}
              variants={scaleIn}
              direction="row"
              spacing={1.25}
              justifyContent="center"
              alignItems="center"
            >
              <GavelOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                CasePilot
              </Typography>
            </Stack>

            <Stack
              component={motion.div}
              variants={fadeInUp}
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245,124,0,0.1)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <EmailOutlinedIcon sx={{ color: '#f57c00', fontSize: 28 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                Recuperare parolă
              </Typography>
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.9rem' }}>
                Introduceți adresa de email asociată contului. Veți primi un link de resetare.
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            {!success && (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <Box component={motion.div} variants={fadeInUp}>
                    <TextField
                      type="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nume@exemplu.ro"
                      required
                      fullWidth
                    />
                  </Box>
                  <Button
                    component={motion.button}
                    variants={fadeInUp}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ minHeight: 50, fontWeight: 800 }}
                  >
                    {loading ? 'Se trimite...' : 'Trimite link de resetare'}
                  </Button>
                </Stack>
              </Box>
            )}

            <Typography
              component={motion.p}
              variants={fadeInUp}
              sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                ← Înapoi la autentificare
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
