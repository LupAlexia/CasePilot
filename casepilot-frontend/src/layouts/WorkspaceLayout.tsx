import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Button
} from '@mui/material';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { workspaceNavigation, adminNavigation } from '../config/navigation';
import { useAuth } from '../features/auth/AuthContext';

const sidebarStagger: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15
    }
  }
};

const navItemVariant: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: [0, 0, 0.2, 1] as const
    }
  }
};

export function WorkspaceLayout() {
  const shouldReduceMotion = useReducedMotion();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If no user, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  // Admin sees ONLY admin pages; Lawyer sees ONLY lawyer pages
  const navItems = isAdmin ? adminNavigation : workspaceNavigation;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: 'background.default'
      }}
    >
      <Box
        component="aside"
        sx={{
          width: { xs: '100%', md: 248 },
          background: isAdmin
            ? 'linear-gradient(185deg, #3b1222 0%, #5c1d36 100%)'
            : 'linear-gradient(185deg, #0f2d4e 0%, #123c66 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: { xs: 'none', md: '1px solid rgba(255,255,255,0.1)' },
          borderBottom: { xs: '1px solid rgba(255,255,255,0.14)', md: 'none' }
        }}
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            sx={{
              px: { xs: 2.25, md: 3 },
              py: { xs: 1.8, md: 2.5 },
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <GavelOutlinedIcon />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              CasePilot {isAdmin && '— Admin'}
            </Typography>
            {/* Mobile-only logout (desktop has the button at the bottom) */}
            <Tooltip title="Deconectare">
              <IconButton
                onClick={handleLogout}
                aria-label="Deconectare"
                sx={{
                  display: { xs: 'inline-flex', md: 'none' },
                  ml: 'auto',
                  color: 'rgba(255,255,255,0.85)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }
                }}
              >
                <LogoutOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </motion.div>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* User info */}
        <Box sx={{ px: 3, py: 1.5, display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mb: 0.25 }}>
            Conectat ca
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#e9ecff' }}>
            {user.fullName}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            {user.roles.join(', ')}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', display: { xs: 'none', md: 'block' } }} />

        <List
          component={motion.ul}
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? undefined : sidebarStagger}
          sx={{
            px: { xs: 1.25, md: 1.5 },
            py: { xs: 1.2, md: 2 },
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            overflowX: { xs: 'auto', md: 'visible' },
            overflowY: 'hidden',
            gap: { xs: 0.75, md: 0 },
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            flex: 1
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.path}
                variants={shouldReduceMotion ? undefined : navItemVariant}
                style={{ minWidth: 'fit-content' }}
              >
                <Box
                  sx={{
                    flex: { xs: '0 0 auto', md: '1 1 auto' },
                    minWidth: { xs: 156, md: 'auto' }
                  }}
                >
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    sx={{
                      mb: 0.75,
                      borderRadius: 2.5,
                      color: '#e9ecff',
                      border: '1px solid transparent',
                      transition:
                        'background-color 250ms ease, border-color 250ms ease, transform 180ms ease',
                      '&.active': {
                        backgroundColor: isAdmin
                          ? 'rgba(211, 47, 47, 0.28)'
                          : 'rgba(103, 145, 203, 0.36)',
                        borderColor: 'rgba(255,255,255,0.14)'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        transform: 'translateX(3px)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontWeight: 700 }}
                    />
                  </ListItemButton>
                </Box>
              </motion.div>
            );
          })}
        </List>

        {/* Logout button */}
        <Box sx={{ px: 1.5, pb: 2, display: { xs: 'none', md: 'block' } }}>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutOutlinedIcon />}
            fullWidth
            sx={{
              color: 'rgba(255,255,255,0.6)',
              justifyContent: 'flex-start',
              borderRadius: 2.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff'
              }
            }}
          >
            Deconectare
          </Button>
        </Box>
      </Box>

      <motion.main
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: '100%',
            p: { xs: 1.5, sm: 2, md: 4 },
            maxWidth: 1320
          }}
        >
          <Outlet />
        </Box>
      </motion.main>
    </Box>
  );
}