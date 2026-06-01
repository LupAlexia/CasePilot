import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal, listItem, hoverLift } from '../../../lib/animations';
import { getCaseStatistics } from '../../../services/api/legalCasesApi';
import {
  getRecentDocuments,
  getRecentActivity
} from '../../../services/api/caseDocumentsApi';
import { getHearings, type HearingWithCase } from '../../../services/api/hearingsApi';
import type {
  CaseStatisticsResponse,
  CaseDocument,
  DocumentActivity
} from '../../../services/api/types';

const UPCOMING_DAYS = 7;

function isWithinDays(isoDate: string, days: number): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date >= now && date <= cutoff;
}

function formatHearingDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHearingTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

export function DashboardHome() {
  const shouldReduceMotion = useReducedMotion();
  const [stats, setStats] = useState<CaseStatisticsResponse | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<CaseDocument[]>([]);
  const [recentActivity, setRecentActivity] = useState<DocumentActivity[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<HearingWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const [result, docs, activity, allHearings] = await Promise.all([
          getCaseStatistics(),
          getRecentDocuments(),
          getRecentActivity(),
          getHearings()
        ]);

        if (active) {
          setStats(result);
          setRecentDocuments(docs);
          setRecentActivity(activity);
          const upcoming = allHearings
            .filter(h => isWithinDays(h.date, UPCOMING_DAYS))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setUpcomingHearings(upcoming);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Statisticile nu au putut fi încărcate.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <Typography>Se încarcă statisticile...</Typography>;
  }

  if (error || !stats) {
    return <Alert severity="error">{error || 'Statisticile nu au putut fi încărcate.'}</Alert>;
  }

  return (
    <Stack
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      spacing={3.5}
    >
      <Typography component={motion.h2} variants={fadeInUp} variant="h2">Dashboard</Typography>

      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }
        }}
      >
        {[
          {
            title: 'Termene în următoarele 7 zile',
            value: upcomingHearings.length,
            subtitle: 'termene programate',
            icon: <AccessTimeOutlinedIcon />,
            iconBg: 'rgba(181, 133, 45, 0.14)',
            iconColor: 'secondary.main'
          },
          {
            title: 'Dosare active',
            value: stats.activeCases,
            subtitle: 'în lucru',
            icon: <FolderOpenOutlinedIcon />,
            iconBg: 'rgba(31, 78, 140, 0.12)',
            iconColor: 'primary.main'
          },
          {
            title: 'Documente recente',
            value: recentDocuments.length,
            subtitle: 'în ultimele 7 zile',
            icon: <DescriptionOutlinedIcon />,
            iconBg: 'rgba(181, 133, 45, 0.2)',
            iconColor: 'primary.main'
          }
        ].map((card) => (
          <Paper
            component={motion.div}
            key={card.title}
            variants={cardReveal}
            whileHover={shouldReduceMotion ? undefined : hoverLift}
            sx={{ p: 3.2, transition: 'box-shadow 0.3s ease' }}
          >
            <Stack spacing={2.1}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Typography variant="h4" sx={{ maxWidth: 220 }}>
                  {card.title}
                </Typography>
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: card.iconBg, color: card.iconColor }}
                >
                  {card.icon}
                </Stack>
              </Stack>
              <Typography sx={{ fontSize: '2.15rem', fontWeight: 800, lineHeight: 1 }}>{card.value}</Typography>
              <Typography color="text.secondary">{card.subtitle}</Typography>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }
        }}
      >
        <Paper component={motion.div} variants={cardReveal} sx={{ p: 3.2 }}>
          <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 2.2 }}>
            <CalendarMonthOutlinedIcon color="secondary" fontSize="small" />
            <Typography variant="h4">Termene apropiate</Typography>
          </Stack>
          {upcomingHearings.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Nu există termene în următoarele {UPCOMING_DAYS} zile.
            </Typography>
          ) : (
            <Box sx={{
              maxHeight: 360, overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 5 },
              '&::-webkit-scrollbar-thumb': { borderRadius: 4, bgcolor: 'rgba(31,78,140,0.2)' }
            }}>
              <Stack
                component={motion.div}
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                spacing={1.4}
              >
                {upcomingHearings.map((hearing) => (
                  <Paper
                    component={motion.div}
                    key={hearing.id}
                    variants={listItem}
                    whileHover={shouldReduceMotion ? undefined : { x: 4, backgroundColor: 'rgba(31, 78, 140, 0.04)' }}
                    variant="outlined"
                    sx={{ p: 2, transition: 'background-color 200ms ease' }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.93rem' }}>{hearing.caseNumber}</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                          {hearing.court}
                          {hearing.title ? ` · ${hearing.title}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography sx={{ color: 'secondary.main', fontWeight: 800, fontSize: '0.9rem' }}>
                          {formatHearingDate(hearing.date)}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                          {formatHearingTime(hearing.date)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        <Paper component={motion.div} variants={cardReveal} sx={{ p: 3.2 }}>
          <Typography variant="h4" sx={{ mb: 2.2 }}>
            Activitate recentă
          </Typography>
          <Box sx={{
            maxHeight: 360, overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 5 },
            '&::-webkit-scrollbar-thumb': { borderRadius: 4, bgcolor: 'rgba(31,78,140,0.2)' }
          }}>
            <Stack
              component={motion.div}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              spacing={2.2}
            >
              {recentActivity.map((activity) => (
                <Stack
                  component={motion.div}
                  key={activity.id}
                  variants={listItem}
                  direction="row"
                  spacing={1.4}
                >
                  <Box
                    component={motion.div}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    sx={{ width: 8, height: 8, borderRadius: '50%', mt: 0.85, backgroundColor: 'secondary.main', flexShrink: 0 }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{activity.action}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {activity.documentName} · Dosar {activity.caseNumber}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.45, fontSize: '0.75rem' }}>
                      {new Date(activity.date).toLocaleString('ro-RO')}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Stack>
  );
}
