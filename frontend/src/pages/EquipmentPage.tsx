import React, { useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Grid,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentService } from '../services/equipment'
import { Equipment, EquipmentType } from '../types'

const EquipmentPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    type_id: '',
    asset_number: '',
    serial_number: '',
    brand: '',
    model: '',
    processor: '',
    memory: '',
    storage: '',
    location: '',
    status: 'active',
  })

  const queryClient = useQueryClient()

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentService.list,
  })

  const { data: types } = useQuery({
    queryKey: ['equipment-types'],
    queryFn: equipmentService.getTypes,
  })

  const createMutation = useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setOpen(false)
      setFormData({
        type_id: '',
        asset_number: '',
        serial_number: '',
        brand: '',
        model: '',
        processor: '',
        memory: '',
        storage: '',
        location: '',
        status: 'active',
      })
    },
  })

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name as string]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'maintenance':
        return 'warning'
      default:
        return 'default'
    }
  }

  if (isLoading) {
    return <Typography>Carregando...</Typography>
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número Patrimônio</TableCell>
              <TableCell>Número de Série</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.asset_number}</TableCell>
                <TableCell>{item.serial_number}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.location || '-'}</TableCell>
                <TableCell>
                  <Chip label={item.status} color={getStatusColor(item.status) as any} size="small" />
                </TableCell>
              </TableRow>
            ))}
            {equipment?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum equipamento cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Novo Equipamento</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleChange}
                    label="Tipo"
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
                <TextField
                  name="asset_number"
                  label="Número de Patrimônio"
                  fullWidth
                  value={formData.asset_number}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="serial_number"
                  label="Número de Série"
                  fullWidth
                  value={formData.serial_number}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="brand"
                  label="Marca"
                  fullWidth
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="model"
                  label="Modelo"
                  fullWidth
                  value={formData.model}
                  onChange={handleChange}
                  required
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
                  name="location"
                  label="Localização"
                  fullWidth
                  value={formData.location}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
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
          <Button onClick={handleSubmit} variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EquipmentPage
