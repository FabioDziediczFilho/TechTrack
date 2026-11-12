import React, { useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Grid, Alert, SelectChangeEvent,
  IconButton, Tooltip,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '../services/maintenance'
import { equipmentService } from '../services/equipment'
import { Maintenance, MaintenanceCreateInput, MaintenanceUpdateInput } from '../types'

const MaintenancePage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_type_id: '',
    description: '',
    parts_replaced: '',
    cost: '',
    performed_at: new Date().toISOString().split('T')[0],
  })

  const queryClient = useQueryClient()

  const { data: maintenance, isLoading, error } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.list(),
  })

  const { data: types } = useQuery({
    queryKey: ['maintenance-types'],
    queryFn: maintenanceService.getTypes,
  })

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => equipmentService.list(),
  })

  const createMutation = useMutation({
    mutationFn: maintenanceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      setOpen(false)
      setEditingMaintenance(null)
      setFormData({
        equipment_id: '',
        maintenance_type_id: '',
        description: '',
        parts_replaced: '',
        cost: '',
        performed_at: new Date().toISOString().split('T')[0],
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MaintenanceUpdateInput }) =>
      maintenanceService.update(id, data),
    onSuccess: () => {
      setOpen(false)
      setEditingMaintenance(null)
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: maintenanceService.delete,
    onSuccess: async () => {
      setDeleteError(null)
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
    onError: (mutationError) => setDeleteError(mutationError.message),
  })

  const handleOpen = () => {
    setEditingMaintenance(null)
    setFormData({
      equipment_id: '',
      maintenance_type_id: '',
      description: '',
      parts_replaced: '',
      cost: '',
      performed_at: new Date().toISOString().split('T')[0],
    })
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
    setEditingMaintenance(null)
  }

  const handleEdit = (item: Maintenance) => {
    setEditingMaintenance(item)
    setFormData({
      equipment_id: String(item.equipment_id),
      maintenance_type_id: String(item.maintenance_type_id),
      description: item.description ?? '',
      parts_replaced: item.parts_replaced ?? '',
      cost: item.cost === null ? '' : String(item.cost),
      performed_at: new Date(item.performed_at).toISOString().split('T')[0],
    })
    setOpen(true)
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formDataToSubmit: MaintenanceCreateInput = {
      equipment_id: Number(formData.equipment_id),
      maintenance_type_id: Number(formData.maintenance_type_id),
      description: formData.description || null,
      parts_replaced: formData.parts_replaced || null,
      cost: formData.cost ? Number(formData.cost) : null,
      performed_at: new Date(`${formData.performed_at}T00:00:00`).toISOString(),
    }
    if (editingMaintenance) {
      const updateData: MaintenanceUpdateInput = formDataToSubmit
      updateMutation.mutate({ id: editingMaintenance.id, data: updateData })
    } else {
      createMutation.mutate(formDataToSubmit)
    }
  }

  const handleDelete = (item: Maintenance) => {
    if (window.confirm('Excluir este registro de manutenção? Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate(item.id)
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Erro ao carregar manutenções. Certifique-se de que o backend está rodando em http://localhost:8000
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Manutenção</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Registrar Manutenção
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {deleteError && <Alert severity="error">{`Erro ao excluir manutenção: ${deleteError}`}</Alert>}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Equipamento</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Custo</TableCell>
              <TableCell>Realizado em</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maintenance?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {(() => {
                    const selected = equipment?.find((device) => device.id === item.equipment_id)
                    return selected
                      ? `${selected.asset_number || 'Sem patrimônio'} — ${[selected.brand, selected.model].filter(Boolean).join(' ') || 'Marca/modelo não informados'}`
                      : `Equipamento #${item.equipment_id}`
                  })()}
                </TableCell>
                <TableCell>{types?.find((type) => type.id === item.maintenance_type_id)?.name ?? `Tipo #${item.maintenance_type_id}`}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>{item.cost ? `R$ ${item.cost}` : '-'}</TableCell>
                <TableCell>{new Date(item.performed_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <Tooltip title="Editar manutenção">
                    <IconButton aria-label={`Editar manutenção ${item.id}`} onClick={() => handleEdit(item)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir manutenção">
                    <IconButton
                      aria-label={`Excluir manutenção ${item.id}`}
                      color="error"
                      onClick={() => handleDelete(item)}
                      disabled={deleteMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {maintenance?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">Nenhuma manutenção registrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingMaintenance ? 'Editar Manutenção' : 'Registrar Manutenção'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="maintenance-form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {(createMutation.isError || updateMutation.isError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro ao {editingMaintenance ? 'atualizar' : 'registrar'} manutenção:{' '}
                {(editingMaintenance ? updateMutation.error : createMutation.error)?.message}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Equipamento</InputLabel>
                  <Select
                    name="equipment_id"
                    value={formData.equipment_id}
                    onChange={handleSelectChange}
                    label="Equipamento"
                  >
                    {equipment?.map((item) => (
                      <MenuItem key={item.id} value={item.id.toString()}>
                        {item.asset_number || 'Sem patrimônio'} — {[item.brand, item.model].filter(Boolean).join(' ') || 'Sem marca/modelo'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Manutenção</InputLabel>
                  <Select
                    name="maintenance_type_id"
                    value={formData.maintenance_type_id}
                    onChange={handleSelectChange}
                    label="Tipo de Manutenção"
                  >
                    {types?.map((type) => (
                      <MenuItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="parts_replaced"
                  label="Peças Substituídas"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.parts_replaced}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="cost"
                  label="Custo"
                  fullWidth
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="performed_at"
                  label="Data Realizada"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.performed_at}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            type="submit"
            form="maintenance-form"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MaintenancePage
