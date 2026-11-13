import React, { useState } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Grid, Alert, IconButton, SelectChangeEvent,
  useMediaQuery,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentService } from '../services/equipment'
import { Equipment, EquipmentCreateInput } from '../types'

type EquipmentFieldVisibility = {
  computerNumber: boolean
  brandAndModel: boolean
  computerSpecifications: boolean
}

const getEquipmentFieldVisibility = (typeName: string | undefined): EquipmentFieldVisibility => {
  const normalizedName = (typeName ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (/\b(computador|desktop|pc)\b/.test(normalizedName)) {
    return { computerNumber: true, brandAndModel: false, computerSpecifications: true }
  }

  if (/\b(notebook|laptop)\b/.test(normalizedName)) {
    return { computerNumber: true, brandAndModel: true, computerSpecifications: true }
  }

  if (/\b(impressora|printer)\b/.test(normalizedName)) {
    return { computerNumber: false, brandAndModel: true, computerSpecifications: false }
  }

  if (/\b(servidor|server)\b/.test(normalizedName)) {
    return { computerNumber: true, brandAndModel: true, computerSpecifications: true }
  }

  return { computerNumber: true, brandAndModel: true, computerSpecifications: true }
}

const EquipmentPage: React.FC = () => {
  const isMobile = useMediaQuery('(max-width:599px)')
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [formData, setFormData] = useState({
    type_id: '' as string,
    sector_id: '' as string,
    computer_number: '',
    asset_number: '',
    brand: '',
    model: '',
    processor: '',
    processor_generation: '',
    memory: '',
    storage: '',
    observation: '',
    status: 'active',
  })

  const queryClient = useQueryClient()

  const { data: equipment, isLoading, error } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => equipmentService.list(),
  })

  const { data: types } = useQuery({
    queryKey: ['equipment-types'],
    queryFn: equipmentService.getTypes,
  })

  const selectedTypeName = types?.find((type) => type.id === Number(formData.type_id))?.name
  const visibleFields = getEquipmentFieldVisibility(selectedTypeName)

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: equipmentService.getSectors,
  })

  const createMutation = useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setOpen(false)
      setFormData({
        type_id: '',
        sector_id: '',
        computer_number: '',
        asset_number: '',
        brand: '',
        model: '',
        processor: '',
        processor_generation: '',
        memory: '',
        storage: '',
        observation: '',
        status: 'active',
      })
      setEditingEquipment(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EquipmentCreateInput }) =>
      equipmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setOpen(false)
      setEditingEquipment(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['equipment-by-type'] })
      if (selectedEquipment?.id === deletedId) {
        setSelectedEquipment(null)
        setDetailsOpen(false)
      }
    },
  })

  const handleOpen = () => {
    setEditingEquipment(null)
    setFormData({
      type_id: '',
      sector_id: '',
      computer_number: '',
      asset_number: '',
      brand: '',
      model: '',
      processor: '',
      processor_generation: '',
      memory: '',
      storage: '',
      observation: '',
      status: 'active',
    })
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
    setEditingEquipment(null)
  }

  const handleViewDetails = (item: Equipment) => {
    setSelectedEquipment(item)
    setDetailsOpen(true)
  }

  const handleDetailsClose = () => {
    setDetailsOpen(false)
    setSelectedEquipment(null)
  }

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item)
    setFormData({
      type_id: String(item.type_id),
      sector_id: item.sector_id === null ? '' : String(item.sector_id),
      computer_number: item.computer_number ?? '',
      asset_number: item.asset_number ?? '',
      brand: item.brand ?? '',
      model: item.model ?? '',
      processor: item.processor ?? '',
      processor_generation: item.processor_generation ?? '',
      memory: item.memory ?? '',
      storage: item.storage ?? '',
      observation: item.observation ?? '',
      status: item.status,
    })
    setDetailsOpen(false)
    setOpen(true)
  }

  const handleDelete = (item: Equipment) => {
    const equipmentName = item.computer_number || item.asset_number || `#${item.id}`
    const confirmed = window.confirm(
      `Excluir o equipamento ${equipmentName}?\n\n` +
        'O histórico de alterações, manutenções e alertas de manutenção vinculados serão excluídos. ' +
        'Os chamados serão mantidos, mas ficarão sem vínculo com este equipamento.',
    )
    if (confirmed) {
      deleteMutation.mutate(item.id)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formDataToSubmit: EquipmentCreateInput = {
      ...formData,
      type_id: Number(formData.type_id),
      sector_id: formData.sector_id ? Number(formData.sector_id) : null,
      computer_number: formData.computer_number.trim() || null,
      asset_number: formData.asset_number.trim() || null,
      brand: formData.brand.trim() || null,
      model: formData.model.trim() || null,
      processor: formData.processor || null,
      processor_generation: formData.processor_generation.trim() || null,
      memory: formData.memory || null,
      storage: formData.storage || null,
      observation: formData.observation.trim() || null,
    }
    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, data: formDataToSubmit })
    } else {
      createMutation.mutate(formDataToSubmit)
    }
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'maintenance': return 'warning'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'inactive': return 'Inativo'
      case 'maintenance': return 'Em Manutenção'
      default: return status
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Erro ao carregar equipamentos. Certifique-se de que o backend está rodando em http://localhost:8000
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Equipamentos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} fullWidth={isMobile}>
          Novo Equipamento
        </Button>
      </Box>

      {deleteMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao excluir equipamento: {deleteMutation.error.message}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell>Número do computador</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Setor</TableCell>
              <TableCell>Observação</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment?.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewDetails(item)}
              >
                <TableCell>{item.computer_number || item.asset_number || '-'}</TableCell>
                <TableCell>{item.brand || '-'}</TableCell>
                <TableCell>{item.model || '-'}</TableCell>
                <TableCell>{sectors?.find(s => s.id === item.sector_id)?.name || '-'}</TableCell>
                <TableCell>{item.observation || '-'}</TableCell>
                <TableCell>
                  <Chip label={getStatusLabel(item.status)} color={getStatusColor(item.status) as any} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewDetails(item); }}>
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Editar equipamento ${item.computer_number || item.asset_number || item.id}`}
                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Excluir equipamento ${item.computer_number || item.asset_number || item.id}`}
                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                    disabled={deleteMutation.isPending}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {equipment?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum equipamento cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
        {equipment?.map((item) => (
          <Card
            key={item.id}
            variant="outlined"
            sx={{ cursor: 'pointer' }}
            onClick={() => handleViewDetails(item)}
          >
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                    {item.computer_number || item.asset_number || `Equipamento #${item.id}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[item.brand, item.model].filter(Boolean).join(' ') || 'Marca/modelo não informados'}
                  </Typography>
                </Box>
                <Chip
                  label={getStatusLabel(item.status)}
                  color={getStatusColor(item.status) as any}
                  size="small"
                />
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Setor: {sectors?.find((sector) => sector.id === item.sector_id)?.name || 'Sem setor'}
              </Typography>
              {item.observation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                  {item.observation}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <IconButton
                  size="small"
                  aria-label={`Ver equipamento ${item.computer_number || item.asset_number || item.id}`}
                  onClick={(event) => { event.stopPropagation(); handleViewDetails(item) }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={`Editar equipamento ${item.computer_number || item.asset_number || item.id}`}
                  onClick={(event) => { event.stopPropagation(); handleEdit(item) }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Excluir equipamento ${item.computer_number || item.asset_number || item.id}`}
                  onClick={(event) => { event.stopPropagation(); handleDelete(item) }}
                  disabled={deleteMutation.isPending}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
        {equipment?.length === 0 && (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Nenhum equipamento cadastrado</Typography>
          </Paper>
        )}
      </Box>

      {/* Create Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="equipment-form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {(createMutation.isError || updateMutation.isError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro ao {editingEquipment ? 'atualizar' : 'criar'} equipamento:{' '}
                {(editingEquipment ? updateMutation.error : createMutation.error)?.message}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleSelectChange}
                    label="Tipo"
                    required
                  >
                    {types?.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Setor</InputLabel>
                  <Select
                    name="sector_id"
                    value={formData.sector_id}
                    onChange={handleSelectChange}
                    label="Setor"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {sectors?.map((sector) => (
                      <MenuItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {visibleFields.computerNumber && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="computer_number"
                    label="Número do computador"
                    fullWidth
                    value={formData.computer_number}
                    onChange={handleChange}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  name="asset_number"
                  label="Número de Patrimônio"
                  fullWidth
                  value={formData.asset_number}
                  onChange={handleChange}
                />
              </Grid>
              {visibleFields.brandAndModel && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="brand"
                      label="Marca"
                      fullWidth
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="model"
                      label="Modelo"
                      fullWidth
                      value={formData.model}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              )}
              {visibleFields.computerSpecifications && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="processor"
                      label="Processador"
                      fullWidth
                      value={formData.processor}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="processor_generation"
                      label="Geração do processador"
                      placeholder="Ex.: 13ª geração"
                      fullWidth
                      value={formData.processor_generation}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="memory"
                      label="Memória"
                      fullWidth
                      value={formData.memory}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="storage"
                      label="Armazenamento"
                      fullWidth
                      value={formData.storage}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  name="observation"
                  label="Observação"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.observation}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                    <MenuItem value="maintenance">Em Manutenção</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            type="submit"
            form="equipment-form"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Detalhes do Equipamento</DialogTitle>
        <DialogContent>
          {selectedEquipment && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Número do computador</Typography>
                <Typography variant="body1">{selectedEquipment.computer_number || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Número Patrimônio</Typography>
                <Typography variant="body1">{selectedEquipment.asset_number || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Marca</Typography>
                <Typography variant="body1">{selectedEquipment.brand || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Modelo</Typography>
                <Typography variant="body1">{selectedEquipment.model || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Setor</Typography>
                <Typography variant="body1">{sectors?.find(s => s.id === selectedEquipment.sector_id)?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Processador</Typography>
                <Typography variant="body1">{selectedEquipment.processor || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Geração do processador</Typography>
                <Typography variant="body1">{selectedEquipment.processor_generation || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Memória</Typography>
                <Typography variant="body1">{selectedEquipment.memory || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Armazenamento</Typography>
                <Typography variant="body1">{selectedEquipment.storage || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Observação</Typography>
                <Typography variant="body1">{selectedEquipment.observation || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={getStatusLabel(selectedEquipment.status)} color={getStatusColor(selectedEquipment.status) as any} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Data de Cadastro</Typography>
                <Typography variant="body1">{new Date(selectedEquipment.created_at).toLocaleDateString('pt-BR')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Última Atualização</Typography>
                <Typography variant="body1">{new Date(selectedEquipment.updated_at).toLocaleDateString('pt-BR')}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => selectedEquipment && handleDelete(selectedEquipment)}
            disabled={deleteMutation.isPending}
          >
            Excluir equipamento
          </Button>
          <Button
            onClick={() => selectedEquipment && handleEdit(selectedEquipment)}
            startIcon={<EditIcon />}
          >
            Editar
          </Button>
          <Button onClick={handleDetailsClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EquipmentPage
