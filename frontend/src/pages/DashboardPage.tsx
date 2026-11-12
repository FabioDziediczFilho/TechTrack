import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as EquipmentIcon,
  SupportAgent as TicketsIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard'

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  })

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Erro ao carregar dados do dashboard. Certifique-se de que o backend está rodando em http://localhost:8000
        </Alert>
      </Box>
    )
  }

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
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EquipmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">{stats?.total_equipment || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Equipamentos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TicketsIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              <Box>
                <Typography variant="h4">{stats?.open_tickets || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Chamados Abertos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MaintenanceIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              <Box>
                <Typography variant="h4">{stats?.equipment_with_issues || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Equipamentos com Problemas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DashboardIcon sx={{ fontSize: 40, color: 'success.main' }} />
              <Box>
                <Typography variant="h4">{stats?.avg_resolution_time_days?.toFixed(1) || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Tempo Médio (dias)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gráficos serão adicionados posteriormente
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualizações de dados estão temporariamente desabilitadas
        </Typography>
      </Paper>
    </Box>
  )
}

export default DashboardPage
