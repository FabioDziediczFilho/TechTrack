import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    organization_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(formData)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="COMECE POR AQUI"
      title="Crie sua conta"
      description="Configure seu acesso para organizar a gestão de tecnologia."
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="full_name"
          label="Nome completo"
          name="full_name"
          autoComplete="name"
          autoFocus
          value={formData.full_name}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="E-mail"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type="password"
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          fullWidth
          id="organization_name"
          label="Nome da organização"
          name="organization_name"
          value={formData.organization_name}
          onChange={handleChange}
          helperText="Opcional. Se não informar, usaremos “Organização de [seu nome]”."
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Criar conta'}
        </Button>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{ color: '#087f79', fontWeight: 700, textDecoration: 'none' }}>
            Fazer login
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  )
}

export default RegisterPage
