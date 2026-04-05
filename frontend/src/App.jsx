import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import Login from './pages/Login'
import PatientList from './pages/PatientList'
import PatientDetail from './pages/PatientDetail'
import NewPatient from './pages/NewPatient'
import PrintPrescription from './pages/PrintPrescription'
import Navbar from './components/Navbar'

// Wraps any route that requires login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    // Show a clean full-screen spinner while we check the session cookie
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow">
            <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" />
          </div>
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public — login page */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Print route — no navbar, no auth guard needed beyond what API enforces */}
      <Route path="/print/:patientId/:visitId" element={
        <PrivateRoute><PrintPrescription /></PrivateRoute>
      } />

      {/* All protected routes */}
      <Route path="*" element={
        <PrivateRoute>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-x-hidden">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-6 pb-16">
              <Routes>
                <Route path="/"             element={<PatientList />} />
                <Route path="/patients/new" element={<NewPatient />} />
                <Route path="/patients/:id" element={<PatientDetail />} />
              </Routes>
            </main>
          </div>
        </PrivateRoute>
      } />
    </Routes>
  )
}

// If already logged in, redirect away from /login to home
function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}