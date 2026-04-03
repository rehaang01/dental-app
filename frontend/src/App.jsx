import { Routes, Route } from 'react-router-dom'
import PatientList from './pages/PatientList'
import PatientDetail from './pages/PatientDetail'
import NewPatient from './pages/NewPatient'
import PrintPrescription from './pages/PrintPrescription'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <Routes>
      {/* Print route — no navbar, clean white page */}
      <Route path="/print/:patientId/:visitId" element={<PrintPrescription />} />

      {/* All other routes — normal layout */}
      <Route path="*" element={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/"             element={<PatientList />} />
              <Route path="/patients/new" element={<NewPatient />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  )
}