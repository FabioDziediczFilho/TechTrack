import React from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material'
import {
  BuildRounded as MaintenanceIcon,
  DevicesRounded as EquipmentIcon,
  InsightsRounded as ResolutionIcon,
  NotificationsActiveRounded as AlertsIcon,
  SupportAgentRounded as TicketsIcon,
} from '@mui/icons-material'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard'

const CHART_COLORS = ['#164e70', '#12a89d', '#72c9bd', '#e4a84e', '#7b8ba3']

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Erro ao carregar os dados do dashboard. Tente novamente em instantes.
      </Alert>
    )
  }

  const metrics = [
    {
      label: 'Equipamentos',
      value: stats?.total_equipment ?? 0,
      icon: <EquipmentIcon />,
      color: '#164e70',
      background: '#eaf2f8',
      hint: 'no inventário',
    },
    {
      label: 'Chamados abertos',
      value: stats?.open_tickets ?? 0,
      icon: <TicketsIcon />,
      color: '#087f79',
      background: '#e5f6f3',
      hint: 'aguardando atendimento',
    },
    {
      label: 'Com problemas',
      value: stats?.equipment_with_issues ?? 0,
      icon: <MaintenanceIcon />,
      color: '#bd7620',
      background: '#fff4df',
      hint: 'precisam de atenção',
    },
    {
      label: 'Alertas pendentes',
      value: stats?.pending_maintenance_alerts ?? 0,
      icon: <AlertsIcon />,
      color: '#bd4d59',
      background: '#fff0f1',
      hint: 'manutenções previstas',
    },
    {
      label: 'Tempo médio',
      value: `${stats?.avg_resolution_time_days?.toFixed(1) ?? '0.0'} dias`,
      icon: <ResolutionIcon />,
      color: '#5867a5',
      background: '#eef0fb',
      hint: 'para resolver chamados',
    },
  ]

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 2.5, sm: 3.5, lg: 4 },
          mb: 3,
          color: '#ffffff',
          border: 0,
          background:
            'radial-gradient(circle at 88% 18%, rgba(114,221,209,0.28), transparent 22%), linear-gradient(115deg, #102f49 0%, #164e70 62%, #176b7d 100%)',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 260,
            height: 260,
            right: -80,
            bottom: -180,
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '50%',
            boxShadow: '0 0 0 32px rgba(255,255,255,0.035), 0 0 0 64px rgba(255,255,255,0.025)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
          <Typography
            variant="overline"
            sx={{ color: '#82ded4', fontWeight: 700, letterSpacing: '0.15em' }}
          >
            VISÃO GERAL
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1, color: 'inherit' }}>
            Tudo em ordem. Tudo sob controle.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560 }}>
            Acompanhe os principais indicadores da sua operação e mantenha sua equipe em sintonia.
          </Typography>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
            xl: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {metrics.map((metric) => (
          <Card key={metric.label} sx={{ minWidth: 0 }}>
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {metric.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ mt: 1, mb: 0.5, color: 'text.primary', overflowWrap: 'anywhere' }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 3,
                    color: metric.color,
                    bgcolor: metric.background,
                  }}
                >
                  {metric.icon}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {metric.hint}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(300px, 1fr)' },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{ p: { xs: 2, sm: 2.75 }, border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h6">Movimento de chamados</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Volume registrado nos últimos 30 dias
          </Typography>
          <Box sx={{ width: '100%', height: { xs: 260, sm: 320 } }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ticketsByPeriod || []} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e9eef4" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#77869a', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: '#77869a', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e5ebf2',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(18,45,70,0.1)',
                  }}
                />
                <Legend verticalAlign="top" align="right" height={32} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#12a89d"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: '#164e70', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Chamados"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: { xs: 2, sm: 2.75 }, border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h6">Inventário por tipo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Distribuição dos equipamentos cadastrados
          </Typography>
          <Box sx={{ width: '100%', height: { xs: 260, sm: 320 } }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={equipmentByType || []}
                  cx="50%"
                  cy="48%"
                  innerRadius={56}
                  outerRadius={94}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="type_name"
                  label={({ type_name, percent }) =>
                    `${type_name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(equipmentByType || []).map((item, index) => (
                    <Cell key={`cell-${item.type_name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e5ebf2',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(18,45,70,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default DashboardPage
