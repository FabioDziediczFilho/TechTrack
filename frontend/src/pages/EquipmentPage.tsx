import React, { useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Grid, Alert, IconButton, SelectChangeEvent,
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

const EquipmentPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [formData, setFormData] = useState({
    type_id: '' as string,
    sector_id: '' as string,
    asset_number: '',
    brand: '',
    model: '',
    processor: '',
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
        asset_number: '',
        brand: '',
        model: '',
        processor: '',
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
      asset_number: '',
      brand: '',
      model: '',
      processor: '',
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
      asset_number: item.asset_number ?? '',
      brand: item.brand ?? '',
      model: item.model ?? '',
      processor: item.processor ?? '',
      memory: item.memory ?? '',
      storage: item.storage ?? '',
      observation: item.observation ?? '',
      status: item.status,
    })
    setDetailsOpen(false)
    setOpen(true)
  }

  const handleDelete = (item: Equipment) => {
    const equipmentName = item.asset_number || `#${item.id}`
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
      asset_number: formData.asset_number.trim() || null,
      brand: formData.brand.trim() || null,
      model: formData.model.trim() || null,
      processor: formData.processor || null,
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Equipamentos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Novo Equipamento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {deleteMutation.isError && (
          <Alert severity="error" sx={{ m: 2 }}>
            Erro ao excluir equipamento: {deleteMutation.error.message}
          </Alert>
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número Patrimônio</TableCell>
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
                <TableCell>{item.asset_number || '-'}</TableCell>
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
                    aria-label={`Editar equipamento ${item.asset_number || item.id}`}
                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Excluir equipamento ${item.asset_number || item.id}`}
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

      {/* Create Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="asset_number"
                  label="Número de Patrimônio"
                  fullWidth
                  value={formData.asset_number}
                  onChange={handleChange}
                />
              </Grid>
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
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes do Equipamento</DialogTitle>
        <DialogContent>
          {selectedEquipment && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
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
