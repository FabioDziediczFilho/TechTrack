import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CircularProgress } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const EquipmentPage = lazy(() => import('./pages/EquipmentPage'))
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<CircularProgress sx={{ display: 'block', m: 4 }} />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/tickets" element={<Navigate to="/dashboard" replace />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
