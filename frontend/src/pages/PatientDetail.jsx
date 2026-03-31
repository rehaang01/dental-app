import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPatient, updateTreatment, addVisit, updateBilling, updatePatient } from '../api'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showTreatmentEdit, setShowTreatmentEdit] = useState(false)
  const [showBillingEdit, setShowBillingEdit] = useState(false)
  const [showEditPatient, setShowEditPatient] = useState(false)

  useEffect(() => { fetchPatient() }, [id])

  async function fetchPatient() {
    setLoading(true)
    try {
      const res = await getPatient(id)
      setPatient(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading) return <div className="text-gray-400 text-center py-20">Loading...</div>
  if (!patient) return <div className="text-red-500 text-center py-20">Patient not found.</div>

  const b = patient.billing
  const tp = patient.treatmentPlan

  return (
    
    <div>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        ← Back to patients
      </button>
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-blue-600 text-sm font-semibold">{patient.patientCode}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Dr. {patient.assignedDoctor}</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">{patient.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {patient.gender} · {patient.age} yrs · {new Date(patient.dob).toLocaleDateString('en-IN')}
            </p>
            <p className="text-gray-500 text-sm">{patient.address}</p>
            <div className="flex gap-2 mt-2">
              {patient.contactNumbers.map((n, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{n}</span>
              ))}
            </div>
            {patient.remarks && <p className="text-sm text-gray-500 mt-2 italic">"{patient.remarks}"</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditPatient(true)}
              className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
            >
              Edit Patient
            </button>
            <button
              onClick={() => setShowVisitModal(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
            >
              + Add Visit
            </button>
          </div>
        </div>

        {/* Billing summary bar */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Estimated Total</p>
            <p className="text-lg font-semibold text-gray-800">₹{b?.estimatedTotal?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total Paid</p>
            <p className="text-lg font-semibold text-green-600">₹{b?.totalPaid?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Balance Due</p>
            <p className={`text-lg font-semibold ${b?.balanceDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
              ₹{b?.balanceDue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {['overview', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'overview' ? 'Treatment & Billing' : 'Visit History'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Treatment Plan */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Treatment Plan</h2>
              <button onClick={() => setShowTreatmentEdit(true)} className="text-xs text-blue-600 hover:underline">Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Upper Right', tp?.upperRight],
                ['Upper Left', tp?.upperLeft],
                ['Lower Right', tp?.lowerRight],
                ['Lower Left', tp?.lowerLeft],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                  <p className="text-sm text-gray-700">{val || <span className="text-gray-300 italic">Empty</span>}</p>
                </div>
              ))}
            </div>
            {tp?.general && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-500 font-medium mb-1">General</p>
                <p className="text-sm text-gray-700">{tp.general}</p>
              </div>
            )}
          </div>

          {/* Billing */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Billing History</h2>
              <button onClick={() => setShowBillingEdit(true)} className="text-xs text-blue-600 hover:underline">Adjust</button>
            </div>
            {b?.history?.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No billing changes yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {b?.history?.map((h, i) => (
                  <div key={i} className="text-xs border-b border-gray-100 pb-2">
                    <div className="flex justify-between text-gray-600">
                      <span>{new Date(h.changedAt).toLocaleDateString('en-IN')}</span>
                      <span className="font-medium">Balance: ₹{h.newBalance.toFixed(2)}</span>
                    </div>
                    {h.comment && <p className="text-gray-400 italic mt-0.5">"{h.comment}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {patient.visits?.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
              <p className="text-3xl mb-2">📋</p>
              <p>No visits recorded yet.</p>
            </div>
          ) : (
            patient.visits?.map((v, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium text-gray-800">{new Date(v.visitDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                    <span className="ml-2 text-xs text-gray-500 capitalize">Dr. {v.doctor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.paymentDelta !== 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.paymentDelta > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {v.paymentDelta > 0 ? `+₹${v.paymentDelta}` : `-₹${Math.abs(v.paymentDelta)}`}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${v.whatsappSent ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {v.whatsappSent ? '✓ WhatsApp sent' : 'No WhatsApp'}
                    </span>
                  </div>
                </div>
                {v.treatmentDoneToday && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Treatment done</p>
                    <p className="text-sm text-gray-700">{v.treatmentDoneToday}</p>
                  </div>
                )}
                {v.medicinesInstructions && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Instructions / Medicines</p>
                    <p className="text-sm text-gray-700">{v.medicinesInstructions}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {showEditPatient && (
        <EditPatientModal
          patient={patient}
          onClose={() => setShowEditPatient(false)}
          onSaved={() => { setShowEditPatient(false); fetchPatient() }}
        />
      )}
      {/* Add Visit Modal */}
      {showVisitModal && (
        <VisitModal
          patient={patient}
          onClose={() => setShowVisitModal(false)}
          onSaved={() => { setShowVisitModal(false); fetchPatient() }}
        />
      )}

      {/* Edit Treatment Modal */}
      {showTreatmentEdit && (
        <TreatmentModal
          patient={patient}
          onClose={() => setShowTreatmentEdit(false)}
          onSaved={() => { setShowTreatmentEdit(false); fetchPatient() }}
        />
      )}

      {/* Edit Billing Modal */}
      {showBillingEdit && (
        <BillingModal
          patient={patient}
          onClose={() => setShowBillingEdit(false)}
          onSaved={() => { setShowBillingEdit(false); fetchPatient() }}
        />
      )}
    </div>
  )
}

// ─── Visit Modal ────────────────────────────────────────────────
function VisitModal({ patient, onClose, onSaved }) {
  const [form, setForm] = useState({
    treatmentDoneToday: '',
    medicinesInstructions: '',
    paymentDelta: '',
    includeDuesReminder: false,
  })
  const [saving, setSaving] = useState(false)
  const [waStatus, setWaStatus] = useState(null)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await addVisit({
        patientId: patient.id,
        doctor: patient.assignedDoctor,
        ...form,
        changedBy: patient.assignedDoctor,
      })
      setWaStatus(res.data.whatsappSent ? 'sent' : res.data.whatsappError || 'not sent')
      setTimeout(onSaved, 1500)
    } catch (err) {
      alert('Error saving visit: ' + err.message)
    }
    setSaving(false)
  }

  const field = "border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add Visit — {patient.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment done today</label>
            <textarea
              className={field} rows={3}
              placeholder="e.g. Root canal on upper left central incisor completed..."
              value={form.treatmentDoneToday}
              onChange={e => setForm({ ...form, treatmentDoneToday: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicines & Instructions</label>
            <textarea
              className={field} rows={3}
              placeholder="e.g. Amoxicillin 500mg twice daily for 5 days. Avoid cold drinks..."
              value={form.medicinesInstructions}
              onChange={e => setForm({ ...form, medicinesInstructions: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
            <input
              type="number"
              className={field}
              placeholder="+ amount to add charge  /  - amount for payment received (e.g. -500)"
              value={form.paymentDelta}
              onChange={e => setForm({ ...form, paymentDelta: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Use positive number to add a charge, negative to record a payment</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.includeDuesReminder}
              onChange={e => setForm({ ...form, includeDuesReminder: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">Include dues reminder in WhatsApp message</span>
          </label>

          {waStatus && (
            <p className={`text-sm ${waStatus === 'sent' ? 'text-green-600' : 'text-orange-500'}`}>
              {waStatus === 'sent' ? '✓ WhatsApp message sent!' : `WhatsApp: ${waStatus}`}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Visit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Treatment Modal ─────────────────────────────────────────────
function TreatmentModal({ patient, onClose, onSaved }) {
  const tp = patient.treatmentPlan
  const [form, setForm] = useState({
    upperRight: tp?.upperRight || '',
    upperLeft: tp?.upperLeft || '',
    lowerRight: tp?.lowerRight || '',
    lowerLeft: tp?.lowerLeft || '',
    general: tp?.general || '',
    comment: '',
    changedBy: patient.assignedDoctor,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateTreatment(patient.id, form)
      onSaved()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const field = "border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Treatment Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['upperRight','Upper Right'],['upperLeft','Upper Left'],['lowerRight','Lower Right'],['lowerLeft','Lower Left']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <textarea className={field} rows={2} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={`Treatments for ${label}...`} />
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">General (scaling, checkup etc)</label>
          <textarea className={field} rows={2} value={form.general} onChange={e => setForm({...form, general: e.target.value})} placeholder="General notes..." />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Comment (like a commit message)</label>
          <input className={field} value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} placeholder="e.g. Updated after RCT session 2..." />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Billing Modal ───────────────────────────────────────────────
function BillingModal({ patient, onClose, onSaved }) {
  const b = patient.billing
  const [form, setForm] = useState({
    estimatedTotal: b?.estimatedTotal || 0,
    totalPaid: b?.totalPaid || 0,
    comment: '',
    changedBy: patient.assignedDoctor,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateBilling(patient.id, form)
      onSaved()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const field = "border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Adjust Billing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Total (₹)</label>
            <input type="number" className={field} value={form.estimatedTotal} onChange={e => setForm({...form, estimatedTotal: parseFloat(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total Paid (₹)</label>
            <input type="number" className={field} value={form.totalPaid} onChange={e => setForm({...form, totalPaid: parseFloat(e.target.value)})} />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            Balance Due: <span className="font-semibold text-red-500">₹{(form.estimatedTotal - form.totalPaid).toFixed(2)}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Comment</label>
            <input className={field} value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} placeholder="e.g. Payment received on 30 March..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
// ─── Edit Patient Modal ──────────────────────────────────────────
const COUNTRY_CODES = [
  { name: 'India', code: 'IN', dial: '+91' },
  { name: 'USA', code: 'US', dial: '+1' },
  { name: 'UK', code: 'GB', dial: '+44' },
  { name: 'UAE', code: 'AE', dial: '+971' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966' },
  { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'Australia', code: 'AU', dial: '+61' },
  { name: 'Singapore', code: 'SG', dial: '+65' },
  { name: 'Nepal', code: 'NP', dial: '+977' },
  { name: 'Bangladesh', code: 'BD', dial: '+880' },
  { name: 'Pakistan', code: 'PK', dial: '+92' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94' },
  { name: 'Other', code: 'XX', dial: '+' },
]

function PhoneInput({ value, onChange, placeholder }) {
  const [dialCode, setDialCode] = useState('+91')

  // Extract only the digit portion after the dial code
  const localPart = (() => {
    if (!value) return ''
    if (dialCode !== '+' && value.startsWith(dialCode)) {
      return value.slice(dialCode.length).replace(/\D/g, '')
    }
    // fallback: strip any leading +XX code
    return value.replace(/^\+\d{1,4}/, '').replace(/\D/g, '')
  })()

  function handleNumber(e) {
    if (dialCode === '+') {
      // Other mode: user types full number freely, just strip spaces
      onChange(e.target.value.replace(/\s+/g, ''))
    } else {
      const digits = e.target.value.replace(/\s+/g, '').replace(/\D/g, '')
      onChange(dialCode + digits)
    }
  }

  function handleDial(e) {
    const newDial = e.target.value
    setDialCode(newDial)
    if (newDial === '+') {
      // Switching to Other: clear value so user starts fresh
      onChange('')
    } else {
      // Switching to a real country: keep digits, attach new dial code
      const digits = value
        ? value.replace(/^\+\d{1,4}/, '').replace(/\D/g, '')
        : ''
      onChange(newDial + digits)
    }
  }

  return (
    <div className="flex gap-2">
      <select
        value={dialCode}
        onChange={handleDial}
        className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {COUNTRY_CODES.map(c => (
          <option key={c.code + c.dial} value={c.dial}>
            {c.name} ({c.dial})
          </option>
        ))}
      </select>

      {dialCode === '+' ? (
        // Other mode: free type the full number with country code
        <input
          type="tel"
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. +1234567890"
          value={value || ''}
          onChange={handleNumber}
        />
      ) : (
        // Normal mode: just the local digits, dial code shown in dropdown
        <input
          type="tel"
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder || 'Phone number'}
          value={localPart}
          onChange={handleNumber}
        />
      )}
    </div>
  )
}

function EditPatientModal({ patient, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: patient.name,
    gender: patient.gender,
    age: patient.age,
    dob: new Date(patient.dob).toISOString().split('T')[0],
    address: patient.address,
    country: patient.country || 'India',
    assignedDoctor: patient.assignedDoctor,
    contactNumbers: [...(patient.contactNumbers || ['', '']), '', ''].slice(0, 2),
    remarks: patient.remarks || '',
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  function handlePhone(i, val) {
    const nums = [...form.contactNumbers]
    nums[i] = val.replace(/\s+/g, '')
    setForm({ ...form, contactNumbers: nums })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updatePatient(patient.id, {
        ...form,
        age: parseInt(form.age),
        dob: new Date(form.dob),
        contactNumbers: form.contactNumbers.map(n => n.replace(/\s+/g, '')).filter(n => n.trim() !== '')
      })
      onSaved()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const field = "border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const label = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Patient — {patient.patientCode}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Full Name</label><input name="name" value={form.name} onChange={handleChange} className={field} /></div>
            <div><label className={label}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className={field}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Age</label><input name="age" type="number" value={form.age} onChange={handleChange} className={field} /></div>
            <div><label className={label}>Date of Birth</label><input name="dob" type="date" value={form.dob} onChange={handleChange} className={field} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Country</label>
              <select name="country" value={form.country} onChange={handleChange} className={field}>
                {COUNTRY_CODES.filter(c => c.code !== 'XX').map(c => <option key={c.code}>{c.name}</option>)}
                <option>Other</option>
              </select>
            </div>
            <div><label className={label}>Assigned Doctor</label>
              <select name="assignedDoctor" value={form.assignedDoctor} onChange={handleChange} className={field}>
                <option value="Vanita Goenka">Dr. Vanita Goenka</option>
                <option value="Rajneesh Goenka">Dr. Rajneesh Goenka</option>
              </select>
            </div>
          </div>
          <div><label className={label}>Address</label><textarea name="address" value={form.address} onChange={handleChange} className={field} rows={2} /></div>
          <div><label className={label}>Contact Number 1</label><PhoneInput value={form.contactNumbers[0]} onChange={v => handlePhone(0, v)} placeholder="Primary" /></div>
          <div><label className={label}>Contact Number 2 (optional)</label><PhoneInput value={form.contactNumbers[1]} onChange={v => handlePhone(1, v)} placeholder="Secondary" /></div>
          <div><label className={label}>Remarks</label><textarea name="remarks" value={form.remarks} onChange={handleChange} className={field} rows={2} /></div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}