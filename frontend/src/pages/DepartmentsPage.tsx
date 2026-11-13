import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { equipmentService } from '../services/equipment'
import { Equipment, Sector, SectorInput } from '../types'

const NO_SECTOR = 'none'
type SectorForm = {
  name: string
  description: string
  address: string
  responsible: string
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    case 'maintenance':
      return 'Em manutenção'
    default:
      return status
  }
}

const getStatusColor = (status: string): 'default' | 'success' | 'warning' => {
  switch (status) {
    case 'active':
      return 'success'
    case 'maintenance':
      return 'warning'
    default:
      return 'default'
  }
}

const getEquipmentLabel = (equipment: Equipment) =>
  [equipment.brand, equipment.model].filter(Boolean).join(' ') || 'Marca/modelo não informados'

const DepartmentsPage: React.FC = () => {
  const isMobile = useMediaQuery('(max-width:599px)')
  const [addSectorOpen, setAddSectorOpen] = useState(false)
  const [manageSectorsOpen, setManageSectorsOpen] = useState(false)
  const [editSectorOpen, setEditSectorOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null)
  const [sectorForm, setSectorForm] = useState<SectorForm>({
    name: '',
    description: '',
    address: '',
    responsible: '',
  })
  const [sectorFilter, setSectorFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  const {
    data: equipment,
    isLoading: isLoadingEquipment,
    error: equipmentError,
  } = useQuery({
    queryKey: ['equipment', 'departments'],
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

  const createSectorMutation = useMutation({
    mutationFn: equipmentService.createSector,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sectors'] })
      setAddSectorOpen(false)
      setSectorForm({ name: '', description: '', address: '', responsible: '' })
    },
  })

  const updateSectorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SectorInput> }) =>
      equipmentService.updateSector(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sectors'] })
      setEditSectorOpen(false)
      setSelectedSector(null)
    },
  })

  const deleteSectorMutation = useMutation({
    mutationFn: equipmentService.deleteSector,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sectors'] }),
        queryClient.invalidateQueries({ queryKey: ['equipment'] }),
      ])
    },
  })

  const openSectorEdit = (sector: Sector) => {
    setSelectedSector(sector)
    setSectorForm({
      name: sector.name,
      description: sector.description ?? '',
      address: sector.address ?? '',
      responsible: sector.responsible ?? '',
    })
    setEditSectorOpen(true)
  }

  const handleSectorSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data: SectorInput = {
      name: sectorForm.name.trim(),
      description: sectorForm.description.trim() || null,
      address: sectorForm.address.trim() || null,
      responsible: sectorForm.responsible.trim() || null,
    }
    if (selectedSector && editSectorOpen) {
      updateSectorMutation.mutate({ id: selectedSector.id, data })
    } else {
      createSectorMutation.mutate(data)
    }
  }

  const handleDeleteSector = (sector: Sector) => {
    if (
      window.confirm(
        `Excluir o departamento "${sector.name}"? Os equipamentos serão mantidos sem setor.`,
      )
    ) {
      deleteSectorMutation.mutate(sector.id)
    }
  }

  const filteredEquipment = useMemo(
    () =>
      (equipment ?? []).filter((item) => {
        const matchesSector =
          sectorFilter === '' ||
          (sectorFilter === NO_SECTOR
            ? item.sector_id === null
            : item.sector_id === Number(sectorFilter))
        const matchesType = typeFilter === '' || item.type_id === Number(typeFilter)
        const matchesStatus = statusFilter === '' || item.status === statusFilter
        return matchesSector && matchesType && matchesStatus
      }),
    [equipment, sectorFilter, statusFilter, typeFilter],
  )

  const equipmentBySector = useMemo(() => {
    const groups = new Map<number | null, Equipment[]>()
    filteredEquipment.forEach((item) => {
      const group = groups.get(item.sector_id) ?? []
      group.push(item)
      groups.set(item.sector_id, group)
    })
    return [...groups.entries()].sort(([firstId], [secondId]) => {
      if (firstId === null) return 1
      if (secondId === null) return -1
      const firstName = sectors?.find((sector) => sector.id === firstId)?.name ?? ''
      const secondName = sectors?.find((sector) => sector.id === secondId)?.name ?? ''
      return firstName.localeCompare(secondName)
    })
  }, [filteredEquipment, sectors])

  const isLoading = isLoadingEquipment || isLoadingSectors || isLoadingTypes
  const error = equipmentError || sectorsError || typesError

  if (isLoading) return <Typography>Carregando departamentos...</Typography>

  if (error) {
    return (
      <Alert severity="error">
        Não foi possível carregar os departamentos e equipamentos:
        {' '}
        {error instanceof Error ? error.message : 'erro desconhecido'}
      </Alert>
    )
  }

  const typeNames = new Map((types ?? []).map((type) => [type.id, type.name]))

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 3,
          gap: 1.5,
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Departamentos
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button variant="outlined" onClick={() => setManageSectorsOpen(true)} fullWidth={isMobile}>
            Gerenciar departamentos
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth={isMobile}
            onClick={() => {
              setSelectedSector(null)
              setSectorForm({ name: '', description: '', address: '', responsible: '' })
              setAddSectorOpen(true)
            }}
          >
            Adicionar departamento
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        <FormControl fullWidth>
          <InputLabel id="department-sector-filter-label">Setor</InputLabel>
          <Select
            labelId="department-sector-filter-label"
            value={sectorFilter}
            label="Setor"
            onChange={(event) => setSectorFilter(event.target.value)}
          >
            <MenuItem value="">Todos os setores</MenuItem>
            {(sectors ?? []).map((sector) => (
              <MenuItem key={sector.id} value={String(sector.id)}>
                {sector.name}
              </MenuItem>
            ))}
            <MenuItem value={NO_SECTOR}>Sem setor</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="department-type-filter-label">Tipo de máquina</InputLabel>
          <Select
            labelId="department-type-filter-label"
            value={typeFilter}
            label="Tipo de máquina"
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <MenuItem value="">Todos os tipos</MenuItem>
            {(types ?? []).map((type) => (
              <MenuItem key={type.id} value={String(type.id)}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="department-status-filter-label">Status</InputLabel>
          <Select
            labelId="department-status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="">Todos os status</MenuItem>
            <MenuItem value="active">Ativo</MenuItem>
            <MenuItem value="inactive">Inativo</MenuItem>
            <MenuItem value="maintenance">Em manutenção</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredEquipment.length} equipamento(s) encontrado(s)
      </Typography>

      {equipmentBySector.length === 0 ? (
        <Alert severity="info">Nenhum equipamento corresponde aos filtros selecionados.</Alert>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {equipmentBySector.map(([sectorId, items]) => {
            const sectorName =
              sectorId === null
                ? 'Sem setor'
                : sectors?.find((sector) => sector.id === sectorId)?.name ?? 'Setor'

            return (
              <Card key={sectorId ?? NO_SECTOR}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">{sectorName}</Typography>
                    <Chip label={`${items.length} equipamento(s)`} size="small" />
                  </Box>
                  <Box sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Patrimônio</TableCell>
                          <TableCell>Tipo de máquina</TableCell>
                          <TableCell>Marca e modelo</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => setSelectedEquipment(item)}
                          >
                            <TableCell>{item.asset_number || 'Sem patrimônio'}</TableCell>
                            <TableCell>{typeNames.get(item.type_id) ?? 'Tipo não informado'}</TableCell>
                            <TableCell>{getEquipmentLabel(item)}</TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(item.status)}
                                color={getStatusColor(item.status)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                  <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1 }}>
                    {items.map((item) => (
                      <Paper
                        key={item.id}
                        variant="outlined"
                        sx={{ p: 1.5, cursor: 'pointer' }}
                        onClick={() => setSelectedEquipment(item)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                              {item.asset_number || 'Sem patrimônio'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {typeNames.get(item.type_id) ?? 'Tipo não informado'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                              {getEquipmentLabel(item)}
                            </Typography>
                          </Box>
                          <Chip
                            label={getStatusLabel(item.status)}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}

      <Dialog
        open={selectedEquipment !== null}
        onClose={() => setSelectedEquipment(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Detalhes do equipamento</DialogTitle>
        <DialogContent>
          {selectedEquipment && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Patrimônio</Typography>
                <Typography>{selectedEquipment.asset_number || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Tipo</Typography>
                <Typography>{typeNames.get(selectedEquipment.type_id) ?? '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Marca</Typography>
                <Typography>{selectedEquipment.brand || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Modelo</Typography>
                <Typography>{selectedEquipment.model || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Departamento</Typography>
                <Typography>
                  {sectors?.find((sector) => sector.id === selectedEquipment.sector_id)?.name ?? 'Sem setor'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Processador</Typography>
                <Typography>{selectedEquipment.processor || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Geração do processador</Typography>
                <Typography>{selectedEquipment.processor_generation || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Memória</Typography>
                <Typography>{selectedEquipment.memory || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Armazenamento</Typography>
                <Typography>{selectedEquipment.storage || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Observação</Typography>
                <Typography>{selectedEquipment.observation || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={getStatusLabel(selectedEquipment.status)}
                  color={getStatusColor(selectedEquipment.status)}
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEquipment(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addSectorOpen} onClose={() => setAddSectorOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Adicionar departamento</DialogTitle>
        <DialogContent>
          <Box component="form" id="add-department-form" onSubmit={handleSectorSubmit} sx={{ mt: 2 }}>
            {createSectorMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro ao adicionar departamento: {createSectorMutation.error.message}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField name="name" label="Nome" fullWidth required value={sectorForm.name}
                  onChange={(event) => setSectorForm({ ...sectorForm, name: event.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="description" label="Descrição" fullWidth multiline rows={2}
                  value={sectorForm.description}
                  onChange={(event) => setSectorForm({ ...sectorForm, description: event.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="address" label="Endereço" fullWidth value={sectorForm.address}
                  onChange={(event) => setSectorForm({ ...sectorForm, address: event.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="responsible" label="Responsável" fullWidth value={sectorForm.responsible}
                  onChange={(event) => setSectorForm({ ...sectorForm, responsible: event.target.value })} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSectorOpen(false)}>Cancelar</Button>
          <Button type="submit" form="add-department-form" disabled={createSectorMutation.isPending}>
            {createSectorMutation.isPending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={manageSectorsOpen} onClose={() => setManageSectorsOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Gerenciar departamentos</DialogTitle>
        <DialogContent>
          {deleteSectorMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro ao excluir departamento: {deleteSectorMutation.error.message}
            </Alert>
          )}
          {sectors?.length ? (
            <>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mt: 1, display: { xs: 'none', sm: 'block' } }}
              >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Endereço</TableCell>
                    <TableCell>Responsável</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sectors.map((sector) => (
                    <TableRow key={sector.id}>
                      <TableCell>
                        <Typography>{sector.name}</Typography>
                        {sector.description && (
                          <Typography variant="body2" color="text.secondary">{sector.description}</Typography>
                        )}
                      </TableCell>
                      <TableCell>{sector.address || '-'}</TableCell>
                      <TableCell>{sector.responsible || '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar departamento">
                          <IconButton aria-label={`Editar departamento ${sector.name}`}
                            onClick={() => openSectorEdit(sector)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir departamento">
                          <IconButton aria-label={`Excluir departamento ${sector.name}`} color="error"
                            onClick={() => handleDeleteSector(sector)}
                            disabled={deleteSectorMutation.isPending}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TableContainer>
              <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1, mt: 1 }}>
                {sectors.map((sector) => (
                  <Card key={sector.id} variant="outlined">
                    <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                            {sector.name}
                          </Typography>
                          {sector.description && (
                            <Typography variant="body2" color="text.secondary">
                              {sector.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexShrink: 0 }}>
                          <Tooltip title="Editar departamento">
                            <IconButton
                              aria-label={`Editar departamento ${sector.name}`}
                              onClick={() => openSectorEdit(sector)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir departamento">
                            <IconButton
                              aria-label={`Excluir departamento ${sector.name}`}
                              color="error"
                              onClick={() => handleDeleteSector(sector)}
                              disabled={deleteSectorMutation.isPending}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                        {sector.address || 'Sem endereço'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        Responsável: {sector.responsible || 'Não informado'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 1 }}>Nenhum departamento cadastrado.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageSectorsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editSectorOpen} onClose={() => setEditSectorOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Editar departamento</DialogTitle>
        <DialogContent>
          <Box component="form" id="edit-department-form" onSubmit={handleSectorSubmit} sx={{ mt: 2 }}>
            {updateSectorMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro ao atualizar departamento: {updateSectorMutation.error.message}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField name="name" label="Nome" fullWidth required value={sectorForm.name}
                  onChange={(event) => setSectorForm({ ...sectorForm, name: event.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="description" label="Descrição" fullWidth multiline rows={2}
                  value={sectorForm.description}
                  onChange={(event) => setSectorForm({ ...sectorForm, description: event.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="address" label="Endereço" fullWidth value={sectorForm.address}
                  onChange={(event) => setSectorForm({ ...sectorForm, address: event.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="responsible" label="Responsável" fullWidth value={sectorForm.responsible}
                  onChange={(event) => setSectorForm({ ...sectorForm, responsible: event.target.value })} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSectorOpen(false)}>Cancelar</Button>
          <Button type="submit" form="edit-department-form" disabled={updateSectorMutation.isPending}>
            {updateSectorMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DepartmentsPage
