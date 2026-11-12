import React from 'react'
import { Box, Typography, Paper, Grid } from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as EquipmentIcon,
  SupportAgent as TicketsIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material'

const DashboardPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Visão geral do sistema TechTrack
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <EquipmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Equipamentos
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TicketsIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
            <Box>
              <Typography variant="h4">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Chamados Abertos
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <MaintenanceIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            <Box>
              <Typography variant="h4">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Manutenções Pendentes
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon sx={{ fontSize: 40, color: 'success.main' }} />
            <Box>
              <Typography variant="h4">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Tempo Médio (dias)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chamados Recentes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nenhum chamado registrado ainda.
        </Typography>
      </Paper>
    </Box>
  )
}

export default DashboardPage
