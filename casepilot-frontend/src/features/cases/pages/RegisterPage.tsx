import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal, scaleIn } from '../../../lib/animations';
import { useAuth } from '../../auth/AuthContext';
import { registerUser } from '../../../services/api/authApi';

export function RegisterPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setLoading(true);

    try {
      const user = await registerUser({ email, password, fullName: name });
      login(user);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Înregistrare eșuată.');
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
      {/* Animated background orb */}
      <Box
        component={motion.div}
        aria-hidden
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.25, 0.45, 0.25],
                scale: [1, 1.08, 1],
                rotate: [0, -6, 0]
              }
        }
        transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          width: { xs: 200, md: 320 },
          height: { xs: 200, md: 320 },
          top: { xs: -50, md: -70 },
          left: { xs: -40, md: -30 },
          background: 'radial-gradient(circle at 70% 30%, rgba(31,78,140,0.18), rgba(31,78,140,0.03))',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(2px)'
        }}
      />
      <Box
        component={motion.div}
        aria-hidden
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.15, 0.3, 0.15],
                scale: [1, 1.05, 1]
              }
        }
        transition={shouldReduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        sx={{
          position: 'absolute',
          width: { xs: 140, md: 200 },
          height: { xs: 140, md: 200 },
          bottom: { xs: -30, md: -50 },
          right: { xs: -30, md: -20 },
          background: 'radial-gradient(circle at 40% 60%, rgba(181,133,45,0.14), rgba(181,133,45,0.02))',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(2px)'
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>
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
            spacing={3.25}
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

            <Typography
              component={motion.h3}
              variants={fadeInUp}
              variant="h3"
              sx={{ textAlign: 'center', fontSize: { xs: '1.55rem', sm: '1.75rem' } }}
            >
              Creează un cont nou
            </Typography>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack
                component={motion.div}
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                spacing={2.4}
              >
                <Box component={motion.div} variants={fadeInUp}>
                  <TextField
                    type="text"
                    label="Nume"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ion Popescu"
                    required
                    fullWidth
                  />
                </Box>
                <Box component={motion.div} variants={fadeInUp}>
                  <TextField
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nume@exemplu.ro"
                    required
                    fullWidth
                  />
                </Box>
                <Box component={motion.div} variants={fadeInUp}>
                  <TextField
                    type="password"
                    label="Parolă"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    fullWidth
                  />
                </Box>
                <Box component={motion.div} variants={fadeInUp}>
                  <TextField
                    type="password"
                    label="Confirmare parolă"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
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
                  {loading ? 'Se creează contul...' : 'Creează cont'}
                </Button>
              </Stack>
            </Box>

            <Typography
              component={motion.p}
              variants={fadeInUp}
              sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.95rem' }}
            >
              Am deja cont?{' '}
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ p: 0, minWidth: 0, minHeight: 'auto', verticalAlign: 'baseline' }}
              >
                Autentificare
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}