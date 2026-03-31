import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../api'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [search])

  async function fetchPatients() {
    setLoading(true)
    try {
      const res = await getPatients(search)
      setPatients(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Patients</h1>
        <input
          type="text"
          placeholder="Search by name, ID or phone..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🦷</p>
          <p className="text-lg">No patients yet. Add your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Doctor</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Balance Due</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-mono text-blue-600">{p.patientCode}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.assignedDoctor}</td>
                  <td className="px-4 py-3 text-gray-600">{p.contactNumbers?.[0] || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.billing?.balanceDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      ₹{p.billing?.balanceDue?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/patients/${p.id}`} className="text-blue-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}