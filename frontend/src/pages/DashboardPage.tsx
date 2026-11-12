import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as EquipmentIcon,
  SupportAgent as TicketsIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard'

const COLORS = ['#1976d2', '#dc004e', '#ffc107', '#4caf50', '#9c27b0']

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  })

  const { data: ticketsByPeriod } = useQuery({
    queryKey: ['tickets-by-period'],
    queryFn: () => dashboardService.getTicketsByPeriod(30),
  })

  const { data: equipmentByType } = useQuery({
    queryKey: ['equipment-by-type'],
    queryFn: dashboardService.getEquipmentByType,
  })

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chamados por Período (30 dias)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ticketsByPeriod || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#1976d2" name="Chamados" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Equipamentos por Tipo
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={equipmentByType || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type_name, percent }) => `${type_name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(equipmentByType || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage
