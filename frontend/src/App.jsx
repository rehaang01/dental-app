import { Routes, Route } from 'react-router-dom'
import PatientList from './pages/PatientList'
import PatientDetail from './pages/PatientDetail'
import NewPatient from './pages/NewPatient'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<PatientList />} />
          <Route path="/patients/new" element={<NewPatient />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
        </Routes>
      </main>
    </div>
  )
}