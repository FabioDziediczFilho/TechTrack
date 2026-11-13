import React, { Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  BuildRounded as MaintenanceIcon,
  BusinessRounded as DepartmentsIcon,
  DashboardRounded as DashboardIcon,
  Inventory2Rounded as EquipmentIcon,
  LogoutRounded as LogoutIcon,
  MenuRounded as MenuIcon,
  PeopleAltRounded as UsersIcon,
  AssessmentRounded as ReportsIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 264

const menuItems: { text: string; icon: React.ReactNode; path: string; adminOnly?: boolean }[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Equipamentos', icon: <EquipmentIcon />, path: '/equipment' },
  { text: 'Departamentos', icon: <DepartmentsIcon />, path: '/departments' },
  { text: 'Relatórios', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Manutenção', icon: <MaintenanceIcon />, path: '/maintenance' },
  { text: 'Usuários', icon: <UsersIcon />, path: '/users', adminOnly: true },
]

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  )
  const activeMenuItem = visibleMenuItems.find((item) => item.path === location.pathname)
  const initials = (user?.full_name || 'Usuário')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleNavigate = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
    navigate('/login')
  }

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: '#ffffff',
        background: 'linear-gradient(180deg, #102f49 0%, #0c263d 100%)',
      }}
    >
      <Toolbar sx={{ minHeight: '76px !important', px: 2.5, gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '13px',
            color: '#ffffff',
            bgcolor: 'secondary.main',
          }}
        >
          <EquipmentIcon />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ color: 'inherit', lineHeight: 1.05 }}>
            TechTrack
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }}
          >
            GESTÃO DE TI
          </Typography>
        </Box>
      </Toolbar>

      <Box sx={{ px: 2, pt: 2 }}>
        <Typography
          variant="overline"
          sx={{ pl: 1.5, color: 'rgba(255,255,255,0.46)', fontWeight: 700, letterSpacing: '0.13em' }}
        >
          MENU PRINCIPAL
        </Typography>
        <List sx={{ mt: 1, display: 'grid', gap: 0.5 }}>
          {visibleMenuItems.map((item) => {
            const selected = location.pathname === item.path
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => handleNavigate(item.path)}
                aria-current={selected ? 'page' : undefined}
                sx={{
                  minHeight: 48,
                  px: 1.5,
                  borderRadius: 2.5,
                  color: selected ? '#ffffff' : 'rgba(255,255,255,0.68)',
                  '& .MuiListItemIcon-root': {
                    minWidth: 40,
                    color: selected ? '#73ddd1' : 'rgba(255,255,255,0.54)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(18,168,157,0.2)',
                    boxShadow: 'inset 3px 0 #46c9bb',
                  },
                  '&.Mui-selected:hover': { bgcolor: 'rgba(18,168,157,0.27)' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 700 : 550 }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.25,
            py: 1.5,
            mb: 1,
            borderRadius: 2.5,
            bgcolor: 'rgba(255,255,255,0.06)',
          }}
        >
          <Avatar sx={{ width: 38, height: 38, bgcolor: 'secondary.dark', fontSize: 14, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ color: '#ffffff', fontWeight: 650 }}>
              {user?.full_name || 'Usuário'}
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block', color: 'rgba(255,255,255,0.55)' }}>
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'technician' ? 'Técnico' : 'Membro'}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 44,
            px: 1.5,
            borderRadius: 2.5,
            color: 'rgba(255,255,255,0.68)',
            '& .MuiListItemIcon-root': { minWidth: 40, color: 'inherit' },
            '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.07)' },
          }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Sair da conta" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="primary"
            aria-label="Abrir menu"
            edge="start"
            onClick={() => setMobileOpen((open) => !open)}
            sx={{ mr: 1.5, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              {activeMenuItem?.text || 'TechTrack'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Gestão de tecnologia com visão completa
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 650, lineHeight: 1.35 }}>
                {user?.full_name || 'Usuário'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'technician' ? 'Técnico' : 'Membro'}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: '#dff4f1',
                color: 'secondary.dark',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 0 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 0,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflowX: 'hidden',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        <Container maxWidth="xl" disableGutters>
          <Suspense
            fallback={
              <Box
                role="status"
                aria-label="Carregando página"
                sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}
              >
                <CircularProgress />
              </Box>
            }
          >
            <Outlet />
          </Suspense>
        </Container>
      </Box>
    </Box>
  )
}

export default Layout
