import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getPatient } from '../api'

export default function PrintPrescription() {
  const { patientId, visitId } = useParams()
  const [patient, setPatient] = useState(null)
  const [visit, setVisit]     = useState(null)
  const [error, setError]     = useState(null)
  const printFired = useRef(false)   // guard against StrictMode double-fire

  useEffect(() => {
    async function load() {
      try {
        const res = await getPatient(patientId)
        const p   = res.data
        const v   = p.visits?.find(v => v.id === visitId)
        if (!v) { setError('Visit not found.'); return }
        setPatient(p)
        setVisit(v)
        // Auto-open print dialog exactly once
        if (!printFired.current) {
          printFired.current = true
          setTimeout(() => window.print(), 500)
        }
      } catch (err) {
        setError('Could not load patient data.')
      }
    }
    load()
  }, [patientId, visitId])

  if (error) return (
    <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
  )

  if (!patient || !visit) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-3">🦷</div>
        <p>Preparing prescription…</p>
      </div>
    </div>
  )

  const visitDate = new Date(visit.visitDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  // The user who added this visit (logged-in user), fallback to assigned doctor
  const signatoryName = visit.changedBy || ('Dr. ' + visit.doctor)

  // Parse medicines into a list — split on newlines or semicolons
  const medicines = visit.medicinesInstructions
    ? visit.medicinesInstructions
        .split(/\n|;/)
        .map(s => s.trim())
        .filter(Boolean)
    : []

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="no-print bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Prescription preview — <span className="font-medium text-gray-700">{patient.name}</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 italic">
            💡 Uncheck <strong>Headers and footers</strong> in the print dialog to hide the URL
          </span>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Prescription */}
      <div className="prescription-page">

        {/* Header */}
        <div className="rx-header">
          <img src="/logo.jpg" alt="Clinic Logo" className="rx-clinic-logo-img" />
          <div>
            <h1 className="rx-clinic-name">Goenka's Dental Care Centre</h1>
            <p className="rx-clinic-sub">Vanita &amp; Rajneesh Goenka · Amritsar, Punjab</p>
          </div>
        </div>

        <div className="rx-divider" />

        {/* Patient Info */}
        <div className="rx-patient-grid">
          <div>
            <span className="rx-field-label">Patient Name</span>
            <span className="rx-field-value">{patient.name}</span>
          </div>
          <div>
            <span className="rx-field-label">Patient ID</span>
            <span className="rx-field-value font-mono">{patient.patientCode}</span>
          </div>
          <div>
            <span className="rx-field-label">Age / Gender</span>
            <span className="rx-field-value">{patient.age} yrs · {patient.gender}</span>
          </div>
          <div>
            <span className="rx-field-label">Date</span>
            <span className="rx-field-value">{visitDate}</span>
          </div>
          <div>
            <span className="rx-field-label">Doctor</span>
            <span className="rx-field-value">Dr. {visit.doctor}</span>
          </div>
          <div>
            <span className="rx-field-label">Contact</span>
            <span className="rx-field-value">{patient.contactNumbers?.[0] || '—'}</span>
          </div>
        </div>

        <div className="rx-divider" />

        {/* Treatment Done */}
        {visit.treatmentDoneToday && (
          <div className="rx-section">
            <h2 className="rx-section-title">Treatment Done Today</h2>
            <p className="rx-body-text">{visit.treatmentDoneToday}</p>
          </div>
        )}

        {/* Medicines & Instructions */}
        {medicines.length > 0 && (
          <div className="rx-section">
            <h2 className="rx-section-title">℞ &nbsp;Medicines &amp; Instructions</h2>
            <ul className="rx-medicine-list">
              {medicines.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Signature — logged-in user who added this visit */}
        <div className="rx-signature-row">
          <div />
          <div className="rx-signature-block">
            <div className="rx-signature-line" />
            <p className="rx-signature-name">{signatoryName}</p>
            <p className="rx-signature-sub">Goenka's Dental Care Centre</p>
          </div>
        </div>

        <div className="rx-divider" />

        <p className="rx-footer">Goenka's Dental Care Centre · Amritsar, Punjab</p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page {
            size: A4;
            margin: 20mm 18mm 8mm 18mm;
          }
        }
        @media screen {
          body { background: #f3f4f6; margin: 0; }
          .prescription-page {
            background: white;
            max-width: 720px;
            margin: 24px auto 48px;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            min-height: 940px;
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', system-ui, sans-serif;
          }
        }
        @media print {
          body { background: white; margin: 0; }
          .prescription-page {
            padding: 0;
            min-height: unset;
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', system-ui, sans-serif;
          }
        }
        .rx-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .rx-clinic-logo-img { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; }
        .rx-clinic-name { font-size: 22px; font-weight: 700; color: #1e3a5f; margin: 0 0 4px; letter-spacing: -0.3px; }
        .rx-clinic-sub { font-size: 13px; color: #6b7280; margin: 0; }
        .rx-divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 16px 0; }
        .rx-patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 24px; margin-bottom: 4px; }
        .rx-field-label { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #9ca3af; margin-bottom: 2px; }
        .rx-field-value { display: block; font-size: 13.5px; color: #111827; font-weight: 500; }
        .rx-section { margin: 20px 0; }
        .rx-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1e3a5f; margin: 0 0 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
        .rx-body-text { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; }
        .rx-medicine-list { margin: 0; padding-left: 20px; list-style-type: disc; }
        .rx-medicine-list li { font-size: 14px; color: #374151; line-height: 1.8; }
        .rx-signature-row { display: flex; justify-content: space-between; align-items: flex-end; margin: 24px 0 0; }
        .rx-signature-block { text-align: center; min-width: 200px; }
        .rx-signature-line { border-top: 1px solid #374151; margin-bottom: 6px; }
        .rx-signature-name { font-size: 13px; font-weight: 600; color: #111827; margin: 0; }
        .rx-signature-sub { font-size: 11px; color: #9ca3af; margin: 2px 0 0; }
        .rx-footer { text-align: center; font-size: 11px; color: #9ca3af; margin: 12px 0 0; }
      `}</style>
    </>
  )
}