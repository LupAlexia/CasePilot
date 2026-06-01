import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import ArrowRightAltOutlinedIcon from '@mui/icons-material/ArrowRightAltOutlined';
import {
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const cardRevealVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export function HomePage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  return (
    <Stack spacing={0} sx={{ pt: { xs: 1, md: 3 }, overflowX: 'clip' }}>
      <Stack
        component={motion.section}
        initial="hidden"
        animate={heroVisible ? 'visible' : 'hidden'}
        variants={containerVariants}
        spacing={3}
        alignItems="center"
        textAlign="center"
        sx={{
          py: { xs: 10, md: 16 },
          maxWidth: 1020,
          mx: 'auto',
          position: 'relative'
        }}
      >
        <Box
          component={motion.div}
          aria-hidden
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0.4, 0.65, 0.4],
                  scale: [1, 1.06, 1],
                  rotate: [0, 6, 0]
                }
          }
          transition={shouldReduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            width: { xs: 170, md: 250 },
            height: { xs: 170, md: 250 },
            top: { xs: 20, md: -12 },
            right: { xs: -20, md: -60 },
            background: 'radial-gradient(circle at 30% 30%, rgba(31,78,140,0.23), rgba(31,78,140,0.05))',
            borderRadius: '50%',
            pointerEvents: 'none',
            filter: 'blur(2px)'
          }}
        />
        <Typography
          component={motion.h1}
          variants={fadeInUpVariants}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          variant="h1"
          sx={{
            fontFamily: 'Merriweather, Georgia, serif',
            fontSize: { xs: '2.1rem', md: '3.6rem' },
            lineHeight: 1.2,
            letterSpacing: '-0.01em'
          }}
        >
          Control total asupra dosarelor.
          <br />
          Fără termene ratate.
        </Typography>
        <Typography
          component={motion.p}
          variants={fadeInUpVariants}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          sx={{ color: 'text.secondary', fontSize: { xs: '1.08rem', md: '1.35rem' }, maxWidth: 840, lineHeight: 1.65 }}
        >
          CasePilot automatizează termenele de judecată, organizează documentele și te ajută să redactezi acte juridice -
          concentrează-te pe strategie, nu pe birocrație.
        </Typography>
        <Stack component={motion.div} variants={fadeInUpVariants} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={motion.button}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03, y: -2, boxShadow: '0 18px 30px rgba(27, 74, 131, 0.36)' }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            size="large"
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              px: 5.7,
              py: 1.5,
              minHeight: 58,
              fontSize: '1.04rem',
              fontWeight: 800,
              color: '#fefeff',
              background: 'linear-gradient(135deg, #1a4b86 0%, #2b67b1 100%)',
              boxShadow: '0 12px 26px rgba(27, 74, 131, 0.32)',
              border: '1px solid rgba(17, 54, 99, 0.35)'
            }}
          >
            Începe acum
          </Button>
          <Button
            component={motion.button}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            size="large"
            variant="outlined"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            sx={{
              px: 5.2,
              py: 1.34,
              minHeight: 56,
              fontSize: '1.01rem',
              fontWeight: 700,
              color: 'primary.dark',
              borderWidth: 2,
              borderColor: 'rgba(20, 58, 99, 0.58)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 8px 20px rgba(24, 56, 93, 0.14)',
              '&:hover': {
                borderWidth: 2,
                borderColor: 'primary.dark',
                backgroundColor: '#ffffff'
              }
            }}
          >
            Ce oferim
          </Button>
        </Stack>
        <Typography component={motion.p} variants={fadeInUpVariants} sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
          Gândit pentru avocați. Creat pentru precizie.
        </Typography>
      </Stack>

      <Box sx={{ py: { xs: 8, md: 10 }, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(237,242,248,0.72)' }}>
        <Stack spacing={6} sx={{ maxWidth: 1260, mx: 'auto', px: { xs: 1, md: 2 } }}>
          <Typography
            component={motion.h2}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            variant="h2"
            sx={{ textAlign: 'center', fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            Construit pentru rigoarea juridică
          </Typography>
          <Grid component={motion.div} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} container spacing={4}>
            {[
              { icon: <CheckCircleOutlineOutlinedIcon />, text: 'Nu rata niciun termen procedural' },
              { icon: <SyncOutlinedIcon />, text: 'Date actualizate automat din portalul instanțelor' },
              { icon: <BarChartOutlinedIcon />, text: 'Organizare clară a tuturor dosarelor' },
              { icon: <AutoAwesomeOutlinedIcon />, text: 'Asistență AI adaptată contextului juridic' }
            ].map((item) => (
              <Grid key={item.text} component={motion.div} variants={cardRevealVariants} size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack
                  component={motion.div}
                  whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  spacing={2}
                  alignItems="center"
                  textAlign="center"
                >
                  <Stack
                    component={motion.div}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.08, rotate: 4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ width: 62, height: 62, borderRadius: '50%', backgroundColor: 'rgba(31,78,140,0.12)', color: 'primary.main' }}
                  >
                    {item.icon}
                  </Stack>
                  <Typography sx={{ fontWeight: 700 }}>{item.text}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>

      <Stack id="features" spacing={14} sx={{ py: { xs: 9, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid component={motion.div} initial={{ opacity: 0, x: -42 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }}>
            <Stack spacing={2.5}>
              <Box component={motion.div} whileHover={shouldReduceMotion ? undefined : { scale: 1.08, rotate: 4 }} sx={{ width: 56, height: 56, borderRadius: 2.5, display: 'grid', placeItems: 'center', backgroundColor: 'rgba(31,78,140,0.12)', color: 'primary.main' }}>
                <CalendarMonthOutlinedIcon />
              </Box>
              <Typography variant="h3">Termenele se actualizează automat</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '1.08rem', lineHeight: 1.7 }}>
                Introduci numărul dosarului, iar aplicația preia și actualizează automat termenele de judecată din portalul instanțelor.
              </Typography>
              <Paper component={motion.div} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} sx={{ display: 'inline-flex', alignSelf: 'flex-start', px: 2, py: 1, borderRadius: 2.5, backgroundColor: 'rgba(181,133,45,0.14)' }}>
                <Typography sx={{ fontWeight: 700, color: 'primary.dark' }}>Elimini riscul de a rata un termen.</Typography>
              </Paper>
            </Stack>
          </Grid>
          <Grid component={motion.div} initial={{ opacity: 0, x: 42 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }}>
            <Paper component={motion.div} whileHover={shouldReduceMotion ? undefined : { y: -4, boxShadow: '0 16px 36px rgba(17, 43, 68, 0.14)' }} sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={2}>
                {['Dosar 1234/2026 - 15 Aprilie 2026, 10:00', 'Dosar 5678/2026 - 22 Aprilie 2026, 14:30'].map((entry, index) => (
                  <Paper
                    component={motion.div}
                    key={entry}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.12 * index, duration: 0.45 }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    variant="outlined"
                    sx={{ p: 2.25 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CalendarMonthOutlinedIcon color="primary" fontSize="small" />
                      <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>{entry}</Typography>
                      <CheckCircleOutlineOutlinedIcon sx={{ color: '#2f8f4e' }} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={6} alignItems="center">
          <Grid component={motion.div} initial={{ opacity: 0, x: -42 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }} sx={{ order: { xs: 2, lg: 1 } }}>
            <Paper component={motion.div} whileHover={shouldReduceMotion ? undefined : { y: -4, boxShadow: '0 16px 36px rgba(17, 43, 68, 0.14)' }} sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={1.5}>
                {['Dosar Comercial 123/2026', 'Dosar Civil 456/2026', 'Dosar Penal 789/2026'].map((entry, index) => (
                  <Paper
                    component={motion.div}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index, duration: 0.42 }}
                    whileHover={shouldReduceMotion ? undefined : { x: 6 }}
                    key={entry}
                    variant="outlined"
                    sx={{ p: 1.75 }}
                  >
                    <Stack direction="row" spacing={1.3} alignItems="center">
                      <FolderOpenOutlinedIcon color="primary" fontSize="small" />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{entry}</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid component={motion.div} initial={{ opacity: 0, x: 42 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }} sx={{ order: { xs: 1, lg: 2 } }}>
            <Stack spacing={2.5}>
              <Box component={motion.div} whileHover={shouldReduceMotion ? undefined : { scale: 1.08, rotate: 4 }} sx={{ width: 56, height: 56, borderRadius: 2.5, display: 'grid', placeItems: 'center', backgroundColor: 'rgba(31,78,140,0.12)', color: 'primary.main' }}>
                <FolderOpenOutlinedIcon />
              </Box>
              <Typography variant="h3">Toate dosarele, într-un singur loc</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '1.08rem', lineHeight: 1.7 }}>
                Accesezi rapid documente, informații și istoricul fiecărui dosar.
              </Typography>
              <Paper component={motion.div} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} sx={{ display: 'inline-flex', alignSelf: 'flex-start', px: 2, py: 1, borderRadius: 2.5, backgroundColor: 'rgba(181,133,45,0.14)' }}>
                <Typography sx={{ fontWeight: 700, color: 'primary.dark' }}>Claritate și control permanent.</Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={6} alignItems="center">
          <Grid component={motion.div} initial={{ opacity: 0, x: -42 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }}>
            <Stack spacing={2.5}>
              <Box component={motion.div} whileHover={shouldReduceMotion ? undefined : { scale: 1.08, rotate: 4 }} sx={{ width: 56, height: 56, borderRadius: 2.5, display: 'grid', placeItems: 'center', backgroundColor: 'rgba(31,78,140,0.12)', color: 'primary.main' }}>
                <AutoAwesomeOutlinedIcon />
              </Box>
              <Typography variant="h3">Redactezi documente în minute, nu în ore</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '1.08rem', lineHeight: 1.7 }}>
                Generează, completează și sumarizează documente juridice folosind datele din dosar.
              </Typography>
              <Paper component={motion.div} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} sx={{ display: 'inline-flex', alignSelf: 'flex-start', px: 2, py: 1, borderRadius: 2.5, backgroundColor: 'rgba(181,133,45,0.14)' }}>
                <Typography sx={{ fontWeight: 700, color: 'primary.dark' }}>Reduci munca repetitivă.</Typography>
              </Paper>
            </Stack>
          </Grid>
          <Grid component={motion.div} initial={{ opacity: 0, x: 42 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }}>
            <Paper component={motion.div} whileHover={shouldReduceMotion ? undefined : { y: -4, boxShadow: '0 16px 36px rgba(17, 43, 68, 0.14)' }} sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={2}>
                {['Cerere de chemare în judecată', 'Concluzie scrisă'].map((entry, index) => (
                  <Paper
                    component={motion.div}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.11 * index, duration: 0.42 }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    key={entry}
                    variant="outlined"
                    sx={{ p: 2.2 }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.75 }}>
                      <DescriptionOutlinedIcon color="primary" fontSize="small" />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{entry}</Typography>
                    </Stack>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem' }}>Completat automat din datele dosarului</Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <Box sx={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 8, md: 11 }, backgroundColor: 'rgba(237,242,248,0.72)' }}>
        <Stack spacing={6} sx={{ maxWidth: 1260, mx: 'auto' }}>
          <Typography component={motion.h2} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} variant="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.85rem', md: '2.3rem' } }}>
            Costul ascuns al gestionării manuale
          </Typography>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack spacing={2}>
                {[{
                  icon: <WarningAmberOutlinedIcon sx={{ color: '#cf3c3c' }} />,
                  title: 'Termene omise',
                  text: 'Riscul de a pierde termene importante din cauza gestionării manuale'
                }, {
                  icon: <AccessTimeOutlinedIcon sx={{ color: '#cd7a1f' }} />,
                  title: 'Verificări repetitive pe portaluri',
                  text: 'Timp pierdut cu verificări zilnice pe multiple platforme'
                }, {
                  icon: <ManageSearchOutlinedIcon sx={{ color: '#a17a19' }} />,
                  title: 'Redactare manuală consumatoare de timp',
                  text: 'Ore întregi petrecute cu documente repetitive'
                }].map((item, index) => (
                  <Paper
                    component={motion.div}
                    key={item.title}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index, duration: 0.45 }}
                    whileHover={shouldReduceMotion ? undefined : { x: 5, scale: 1.01 }}
                    sx={{ p: 2.5 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      {item.icon}
                      <Box>
                        <Typography sx={{ fontWeight: 800, mb: 0.4 }}>{item.title}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{item.text}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
            <Grid component={motion.div} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} size={{ xs: 12, lg: 6 }}>
              <Paper component={motion.div} whileHover={shouldReduceMotion ? undefined : { y: -4, boxShadow: '0 18px 38px rgba(14, 36, 63, 0.28)' }} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, background: 'linear-gradient(145deg, #164273 0%, #1f4e8c 100%)', color: '#f7fbff' }}>
                <Typography variant="h4" sx={{ color: 'inherit', mb: 2 }}>Soluție</Typography>
                <Typography sx={{ color: 'rgba(247,251,255,0.95)', mb: 3.5, fontSize: '1.08rem', lineHeight: 1.65 }}>
                  CasePilot automatizează partea procedurală, astfel încât tu să te concentrezi pe soluțiile juridice.
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.25)', mb: 2.25 }} />
                <List sx={{ p: 0 }}>
                  {['Sincronizare automată a termenelor', 'Organizare centralizată a dosarelor', 'Generare rapidă de documente'].map((item, index) => (
                    <ListItem
                      component={motion.li}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                      key={item}
                      disableGutters
                      sx={{ py: 0.8 }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                        <CheckCircleOutlineOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>

      <Stack component={motion.section} initial="hidden" whileInView="visible" variants={containerVariants} viewport={{ once: true, amount: 0.2 }} spacing={2.5} alignItems="center" textAlign="center" sx={{ py: { xs: 9, md: 11 }, maxWidth: 860, mx: 'auto' }}>
        <Typography component={motion.h2} variants={fadeInUpVariants} variant="h2">Preia controlul asupra activității tale juridice</Typography>
        <Typography component={motion.p} variants={fadeInUpVariants} sx={{ color: 'text.secondary', fontSize: { xs: '1.03rem', md: '1.2rem' } }}>
          Organizează-ți dosarele și termenele într-un singur sistem.
        </Typography>
        <Button
          component={motion.button}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -2, boxShadow: '0 20px 34px rgba(27, 74, 131, 0.4)' }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          size="large"
          variant="contained"
          endIcon={<ArrowRightAltOutlinedIcon />}
          onClick={() => navigate('/login')}
          sx={{
            px: 5.7,
            py: 1.5,
            minHeight: 58,
            fontSize: '1.04rem',
            fontWeight: 800,
            color: '#fefeff',
            background: 'linear-gradient(135deg, #1a4b86 0%, #2b67b1 100%)',
            boxShadow: '0 12px 26px rgba(27, 74, 131, 0.32)',
            border: '1px solid rgba(17, 54, 99, 0.35)',
            '& .MuiButton-endIcon': {
              transformOrigin: 'left center',
              animation: shouldReduceMotion ? 'none' : 'arrowDrift 1.7s ease-in-out infinite'
            },
            '@keyframes arrowDrift': {
              '0%, 100%': { transform: 'translateX(0)' },
              '50%': { transform: 'translateX(4px)' }
            }
          }}
        >
          Începe acum
        </Button>
      </Stack>

      <Box component={motion.footer} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} sx={{ py: 4, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center', backgroundColor: 'rgba(237,242,248,0.6)' }}>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>© 2026 CasePilot. Toate drepturile rezervate.</Typography>
      </Box>
    </Stack>
  );
}
