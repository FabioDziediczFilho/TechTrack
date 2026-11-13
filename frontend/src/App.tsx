import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Box, CircularProgress } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const EquipmentPage = lazy(() => import('./pages/EquipmentPage'))
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const PageLoading = () => (
  <Box
    role="status"
    aria-label="Carregando página"
    sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}
  >
    <CircularProgress />
  </Box>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <Suspense fallback={<PageLoading />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/register"
              element={
                <Suspense fallback={<PageLoading />}>
                  <RegisterPage />
                </Suspense>
              }
            />

            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/tickets" element={<Navigate to="/dashboard" replace />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
