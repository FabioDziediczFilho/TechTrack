import React, { useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Grid,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '../services/maintenance'
import { Maintenance, MaintenanceType } from '../types'

const MaintenancePage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_type_id: '',
    performed_by: '',
    description: '',
    parts_replaced: '',
    cost: '',
    performed_at: new Date().toISOString().split('T')[0],
  })

  const queryClient = useQueryClient()

  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: maintenanceService.list,
  })

  const { data: types } = useQuery({
    queryKey: ['maintenance-types'],
    queryFn: maintenanceService.getTypes,
  })

  const createMutation = useMutation({
    mutationFn: maintenanceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      setOpen(false)
      setFormData({
        equipment_id: '',
        maintenance_type_id: '',
        performed_by: '',
        description: '',
        parts_replaced: '',
        cost: '',
        performed_at: new Date().toISOString().split('T')[0],
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

  if (isLoading) return <Typography>Carregando...</Typography>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Manutenção</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Registrar Manutenção
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID Equipamento</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Custo</TableCell>
              <TableCell>Realizado em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maintenance?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.equipment_id}</TableCell>
                <TableCell>{item.maintenance_type_id}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>{item.cost ? `R$ ${item.cost}` : '-'}</TableCell>
                <TableCell>{new Date(item.performed_at).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
            {maintenance?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Nenhuma manutenção registrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Manutenção</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="equipment_id"
                  label="ID do Equipamento"
                  fullWidth
                  value={formData.equipment_id}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Manutenção</InputLabel>
                  <Select
                    name="maintenance_type_id"
                    value={formData.maintenance_type_id}
                    onChange={handleChange}
                    label="Tipo de Manutenção"
                  >
                    {types?.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
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
          <Button onClick={handleSubmit} variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MaintenancePage
