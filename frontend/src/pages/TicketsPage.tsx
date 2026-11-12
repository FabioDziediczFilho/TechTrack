import React, { useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Grid,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '../services/tickets'
import { Ticket } from '../types'

const TicketsPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    equipment_id: '',
  })

  const queryClient = useQueryClient()

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: ticketService.list,
  })

  const createMutation = useMutation({
    mutationFn: ticketService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setOpen(false)
      setFormData({ title: '', description: '', priority: 'medium', equipment_id: '' })
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'default'
      case 'medium': return 'info'
      case 'high': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error'
      case 'in_progress': return 'info'
      case 'waiting': return 'warning'
      case 'closed': return 'success'
      default: return 'default'
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Chamados</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Novo Chamado
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>
                  <Chip label={item.priority} color={getPriorityColor(item.priority) as any} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={item.status} color={getStatusColor(item.status) as any} size="small" />
                </TableCell>
                <TableCell>{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
            {tickets?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">Nenhum chamado cadastrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Novo Chamado</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Título"
                  fullWidth
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    label="Prioridade"
                  >
                    <MenuItem value="low">Baixa</MenuItem>
                    <MenuItem value="medium">Média</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="critical">Crítica</MenuItem>
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

export default TicketsPage
