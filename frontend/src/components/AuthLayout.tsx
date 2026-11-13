import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import {
  Inventory2Rounded as BrandIcon,
  DevicesRounded as DevicesIcon,
  InsightsRounded as InsightsIcon,
  VerifiedUserRounded as SecurityIcon,
} from '@mui/icons-material'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

const highlights = [
  { icon: <DevicesIcon />, label: 'Patrimônio organizado' },
  { icon: <InsightsIcon />, label: 'Operação em um só lugar' },
  { icon: <SecurityIcon />, label: 'Acesso seguro por equipe' },
]

const AuthLayout: React.FC<AuthLayoutProps> = ({ eyebrow, title, description, children }) => (
  <Box
    component="main"
    sx={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: 'minmax(380px, 0.92fr) minmax(480px, 1.08fr)' },
      bgcolor: 'background.default',
    }}
  >
    <Box
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        minHeight: { xs: 220, md: '100vh' },
        px: { xs: 3, sm: 5, lg: 8 },
        py: { xs: 3.5, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#ffffff',
        background:
          'radial-gradient(circle at 85% 20%, rgba(18,168,157,0.38), transparent 30%), linear-gradient(145deg, #0d2f49 0%, #164e70 55%, #176b7d 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          zIndex: -1,
          width: 360,
          height: 360,
          right: -170,
          bottom: -180,
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: '50%',
          boxShadow: '0 0 0 42px rgba(255,255,255,0.035), 0 0 0 84px rgba(255,255,255,0.025)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '14px',
            bgcolor: 'secondary.main',
            boxShadow: '0 8px 22px rgba(0,0,0,0.16)',
          }}
        >
          <BrandIcon />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.1, color: 'inherit' }}>
            TechTrack
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)', letterSpacing: '0.12em' }}>
            GESTÃO INTELIGENTE
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 520, my: { xs: 3, md: 8 } }}>
        <Typography
          variant="overline"
          sx={{ color: '#72dbcf', fontWeight: 700, letterSpacing: '0.16em' }}
        >
          TECNOLOGIA SOB CONTROLE
        </Typography>
        <Typography
          variant="h2"
          sx={{
            mt: 1,
            mb: 2,
            color: 'inherit',
            fontSize: { xs: '2rem', sm: '2.7rem', lg: '3.25rem' },
            lineHeight: 1.08,
          }}
        >
          Seu patrimônio. Sua operação. Em sintonia.
        </Typography>
        <Typography
          variant="body1"
          sx={{ maxWidth: 430, color: 'rgba(255,255,255,0.76)', lineHeight: 1.8 }}
        >
          Acompanhe equipamentos, equipes e manutenções com clareza em cada etapa.
        </Typography>
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 1.5,
            mt: 5,
          }}
        >
          {highlights.map((item) => (
            <Box
              key={item.label}
              sx={{
                minHeight: 100,
                p: 1.75,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.14)',
                bgcolor: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ color: '#72dbcf', mb: 1 }}>{item.icon}</Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
        TechTrack · Gestão de tecnologia sem complicação
      </Typography>
    </Box>

    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 4, lg: 8 },
        py: { xs: 3, md: 6 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 460 }}>
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 700, letterSpacing: '0.13em' }}>
            {eyebrow}
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
            {title}
          </Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 18px 50px rgba(18,45,70,0.08)',
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  </Box>
)

export default AuthLayout
