import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  ComputerRounded as SpecificationsIcon,
  DomainRounded as DepartmentIcon,
  Inventory2Rounded as InventoryIcon,
  RuleRounded as StatusIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { equipmentService } from '../services/equipment'
import { Equipment, EquipmentType, Sector } from '../types'

type ReportId = 'inventory' | 'departments' | 'status' | 'specifications'

type ReportOption = {
  id: ReportId
  title: string
  description: string
  icon: React.ReactNode
}

type ReportGroup = {
  id: number | null
  name: string
  equipment: Equipment[]
}

const reportOptions: ReportOption[] = [
  {
    id: 'inventory',
    title: 'Inventário completo',
    description: 'Todos os equipamentos, com patrimônio, tipo, departamento e status.',
    icon: <InventoryIcon />,
  },
  {
    id: 'departments',
    title: 'Inventário por departamento',
    description: 'Equipamentos agrupados por departamento, com subtotais e total geral.',
    icon: <DepartmentIcon />,
  },
  {
    id: 'status',
    title: 'Equipamentos por situação',
    description: 'Relação dos equipamentos ativos, inativos e em manutenção.',
    icon: <StatusIcon />,
  },
  {
    id: 'specifications',
    title: 'Ficha técnica dos equipamentos',
    description: 'Processador, geração, memória, armazenamento e demais especificações.',
    icon: <SpecificationsIcon />,
  },
]

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  maintenance: 'Em manutenção',
}

const statusColors: Record<string, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  maintenance: 'warning',
}

const getStatusLabel = (status: string) => statusLabels[status] ?? status

const ReportTable: React.FC<{
  headers: string[]
  rows: { id: number; cells: React.ReactNode[] }[]
  emptyMessage?: string
}> = ({ headers, rows, emptyMessage = 'Nenhum equipamento cadastrado.' }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small" sx={{ minWidth: 650 }}>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableCell key={header} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow key={row.id} hover>
              {row.cells.map((cell, index) => (
                <TableCell key={`${row.id}-${index}`} sx={{ verticalAlign: 'top' }}>
                  {cell || '-'}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={headers.length} align="center" sx={{ py: 4, color: 'text.secondary' }}>
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
)

const EquipmentStatus: React.FC<{ status: string }> = ({ status }) => (
  <Chip
    size="small"
    label={getStatusLabel(status)}
    color={statusColors[status] ?? 'default'}
  />
)

const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportId>('inventory')

  const {
    data: equipment,
    isLoading: isLoadingEquipment,
    error: equipmentError,
  } = useQuery({
    queryKey: ['equipment', 'reports'],
    queryFn: async () => {
      const allEquipment: Equipment[] = []
      for (let skip = 0; ; skip += 100) {
        const page = await equipmentService.list({ skip, limit: 100 })
        allEquipment.push(...page)
        if (page.length < 100) return allEquipment
      }
    },
  })

  const { data: sectors, isLoading: isLoadingSectors, error: sectorsError } = useQuery({
    queryKey: ['sectors'],
    queryFn: equipmentService.getSectors,
  })

  const { data: types, isLoading: isLoadingTypes, error: typesError } = useQuery({
    queryKey: ['equipment-types'],
    queryFn: equipmentService.getTypes,
  })

  const typeNames = useMemo(
    () => new Map((types ?? []).map((type: EquipmentType) => [type.id, type.name])),
    [types],
  )
  const sectorNames = useMemo(
    () => new Map((sectors ?? []).map((sector: Sector) => [sector.id, sector.name])),
    [sectors],
  )

  const equipmentByDepartment = useMemo(() => {
    const groups = new Map<number | null, Equipment[]>()
    ;(equipment ?? []).forEach((item) => {
      const group = groups.get(item.sector_id) ?? []
      group.push(item)
      groups.set(item.sector_id, group)
    })

    return [...groups.entries()]
      .map(([id, items]): ReportGroup => ({
        id,
        name: id === null ? 'Sem departamento' : sectorNames.get(id) ?? 'Departamento não encontrado',
        equipment: items,
      }))
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
  }, [equipment, sectorNames])

  const isLoading = isLoadingEquipment || isLoadingSectors || isLoadingTypes
  const error = equipmentError || sectorsError || typesError
  const activeReport = reportOptions.find((report) => report.id === selectedReport) ?? reportOptions[0]

  if (isLoading) {
    return (
      <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Carregando relatórios" />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Não foi possível carregar os dados dos relatórios:
        {' '}
        {error instanceof Error ? error.message : 'erro desconhecido'}
      </Alert>
    )
  }

  const equipmentList = equipment ?? []

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Relatórios
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Consulte o inventário e as especificações dos equipamentos cadastrados.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
          mb: 3,
        }}
      >
        {reportOptions.map((report) => {
          const selected = report.id === selectedReport
          return (
            <Card
              key={report.id}
              variant="outlined"
              sx={{
                borderColor: selected ? 'secondary.main' : 'divider',
                bgcolor: selected ? 'rgba(18,168,157,0.06)' : 'background.paper',
              }}
            >
              <CardActionArea
                onClick={() => setSelectedReport(report.id)}
                aria-pressed={selected}
                sx={{ height: '100%', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ display: 'flex', gap: 1.5, p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ color: selected ? 'secondary.dark' : 'text.secondary', mt: 0.25 }}>
                    {report.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {report.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 1,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {activeReport.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeReport.description}
            </Typography>
          </Box>
          <Chip label={`${equipmentList.length} equipamento(s)`} color="primary" variant="outlined" />
        </Box>

        {selectedReport === 'inventory' && (
          <ReportTable
            headers={[
              'Patrimônio',
              'Nº do computador',
              'Tipo',
              'Departamento',
              'Fabricante',
              'Modelo',
              'Status',
            ]}
            rows={equipmentList.map((item) => ({
              id: item.id,
              cells: [
                item.asset_number,
                item.computer_number,
                typeNames.get(item.type_id) ?? `Tipo #${item.type_id}`,
                item.sector_id === null ? 'Sem departamento' : sectorNames.get(item.sector_id) ?? '-',
                item.brand,
                item.model,
                <EquipmentStatus key={`status-${item.id}`} status={item.status} />,
              ],
            }))}
          />
        )}

        {selectedReport === 'departments' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {equipmentByDepartment.length === 0 && (
              <Alert severity="info">Nenhum equipamento cadastrado para agrupar por departamento.</Alert>
            )}
            {equipmentByDepartment.map((group) => (
              <Box key={group.id ?? 'no-department'}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {group.name}
                  </Typography>
                  <Chip size="small" label={`Subtotal: ${group.equipment.length}`} />
                </Box>
                <ReportTable
                  headers={['Patrimônio', 'Nº do computador', 'Tipo', 'Fabricante', 'Modelo', 'Status']}
                  rows={group.equipment.map((item) => ({
                    id: item.id,
                    cells: [
                      item.asset_number,
                      item.computer_number,
                      typeNames.get(item.type_id) ?? `Tipo #${item.type_id}`,
                      item.brand,
                      item.model,
                      <EquipmentStatus key={`status-${item.id}`} status={item.status} />,
                    ],
                  }))}
                />
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Chip color="primary" label={`Total geral: ${equipmentList.length} equipamento(s)`} />
            </Box>
          </Box>
        )}

        {selectedReport === 'status' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {(['active', 'inactive', 'maintenance'] as const).map((status) => {
              const statusEquipment = equipmentList.filter((item) => item.status === status)
              return (
                <Box key={status}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {getStatusLabel(status)}
                    </Typography>
                    <Chip
                      size="small"
                      color={statusColors[status]}
                      label={`${statusEquipment.length} equipamento(s)`}
                    />
                  </Box>
                  <ReportTable
                    headers={[
                      'Patrimônio',
                      'Nº do computador',
                      'Tipo',
                      'Departamento',
                      'Fabricante',
                      'Modelo',
                    ]}
                    rows={statusEquipment.map((item) => ({
                      id: item.id,
                      cells: [
                        item.asset_number,
                        item.computer_number,
                        typeNames.get(item.type_id) ?? `Tipo #${item.type_id}`,
                        item.sector_id === null ? 'Sem departamento' : sectorNames.get(item.sector_id) ?? '-',
                        item.brand,
                        item.model,
                      ],
                    }))}
                    emptyMessage={`Nenhum equipamento ${getStatusLabel(status).toLowerCase()}.`}
                  />
                </Box>
              )
            })}
          </Box>
        )}

        {selectedReport === 'specifications' && (
          <ReportTable
            headers={[
              'Patrimônio',
              'Nº do computador',
              'Tipo',
              'Departamento',
              'Fabricante',
              'Modelo',
              'Processador',
              'Geração',
              'Memória RAM',
              'Armazenamento',
              'Observações',
            ]}
            rows={equipmentList.map((item) => ({
              id: item.id,
              cells: [
                item.asset_number,
                item.computer_number,
                typeNames.get(item.type_id) ?? `Tipo #${item.type_id}`,
                item.sector_id === null ? 'Sem departamento' : sectorNames.get(item.sector_id) ?? '-',
                item.brand,
                item.model,
                item.processor,
                item.processor_generation,
                item.memory,
                item.storage,
                item.observation,
              ],
            }))}
          />
        )}
      </Paper>
    </Box>
  )
}

export default ReportsPage
