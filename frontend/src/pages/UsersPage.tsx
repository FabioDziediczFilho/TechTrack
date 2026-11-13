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
import { Navigate } from 'react-router-dom'
import {
  Add as AddIcon,
  Block as DisableIcon,
  CheckCircle as EnableIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { User, UserRole } from '../types'
import { UserCreateInput, usersService } from '../services/users'

interface UserForm {
  full_name: string
  email: string
  password: string
  role: UserRole
}

const emptyForm: UserForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'user',
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  user: 'Usuário',
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || fallback
  }
  return fallback
}

const UsersPage: React.FC = () => {
  const isMobile = useMediaQuery('(max-width:599px)')
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserForm>(emptyForm)
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  })

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setFormData(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof usersService.update>[1] }) =>
      usersService.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setEditingUser(null)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      usersService.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    if (!normalizedSearch) return users
    return users.filter(
      (item) =>
        item.full_name.toLocaleLowerCase().includes(normalizedSearch) ||
        item.email.toLocaleLowerCase().includes(normalizedSearch),
    )
  }, [search, users])

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: User) => {
    setEditingUser(item)
    setFormData({
      full_name: item.full_name,
      email: item.email,
      password: '',
      role: item.role,
    })
    setDialogOpen(true)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const profile = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: profile })
      return
    }

    const newUser: UserCreateInput = { ...profile, password: formData.password }
    createMutation.mutate(newUser)
  }

  const handleToggleActive = (item: User) => {
    const action = item.is_active ? 'desativar' : 'ativar'
    if (window.confirm(`Deseja ${action} o acesso de ${item.full_name}?`)) {
      toggleActiveMutation.mutate({ id: item.id, is_active: !item.is_active })
    }
  }

  const mutationError =
    createMutation.error || updateMutation.error || toggleActiveMutation.error

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Usuários
          </Typography>
          <Typography color="text.secondary">
            Gerencie os acessos da sua organização.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          fullWidth={isMobile}
        >
          Novo usuário
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(error, 'Não foi possível carregar os usuários.')}
        </Alert>
      )}
      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(mutationError, 'Não foi possível salvar as alterações.')}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6">{users.length} usuários</Typography>
              <Typography variant="body2" color="text.secondary">
                {users.filter((item) => item.is_active).length} com acesso ativo
              </Typography>
            </Box>
            <TextField
              label="Buscar por nome ou e-mail"
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: '100%', sm: 320 } }}
            />
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'} aria-label="Lista de usuários">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.full_name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{roleLabels[item.role]}</TableCell>
                <TableCell>
                  <Chip
                    label={item.is_active ? 'Ativo' : 'Inativo'}
                    color={item.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Editar perfil">
                    <IconButton
                      aria-label={`Editar ${item.full_name}`}
                      onClick={() => openEditDialog(item)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.is_active ? 'Desativar acesso' : 'Ativar acesso'}>
                    <span>
                      <IconButton
                        aria-label={`${item.is_active ? 'Desativar' : 'Ativar'} ${item.full_name}`}
                        onClick={() => handleToggleActive(item)}
                        disabled={item.id === currentUser?.id || toggleActiveMutation.isPending}
                        color={item.is_active ? 'warning' : 'success'}
                      >
                        {item.is_active ? <DisableIcon /> : <EnableIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingUser ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
            <TextField
              label="Nome completo"
              value={formData.full_name}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, full_name: event.target.value }))
              }
              required
              inputProps={{ maxLength: 255 }}
              autoFocus
            />
            <TextField
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, email: event.target.value }))
              }
              required
            />
            {!editingUser && (
              <TextField
                label="Senha inicial"
                type="password"
                value={formData.password}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, password: event.target.value }))
                }
                required
                inputProps={{ minLength: 8 }}
                helperText="A senha deve ter pelo menos 8 caracteres."
              />
            )}
            <FormControl fullWidth>
              <InputLabel id="user-role-label">Perfil</InputLabel>
              <Select
                labelId="user-role-label"
                label="Perfil"
                value={formData.role}
                disabled={editingUser?.id === currentUser?.id}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    role: event.target.value as UserRole,
                  }))
                }
              >
                {Object.entries(roleLabels).map(([role, label]) => (
                  <MenuItem key={role} value={role}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingUser ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default UsersPage
