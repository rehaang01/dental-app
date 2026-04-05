import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPatient, updateTreatment, addVisit, updateBilling, updatePatient, deletePatient, deleteTreatmentHistory, deleteBillingHistory, deleteVisit } from '../api'
import { useAuth } from '../context/useAuth'

// ─── Shared dark-mode-aware class strings ────────────────────────
const CARD  = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
const FIELD = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
const LBL   = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
const BTN_CANCEL = "flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
const MODAL_WRAP = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
const MODAL_BOX  = "bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full"

// ─── Toast notification ───────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [msg])
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${type === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-green-600 text-white'}`}>
      <span>{type === 'error' ? '✕' : '✓'}</span>
      <span>{msg}</span>
      <button onClick={onDone} className="ml-1 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  )
}

// ─── In-app confirm dialog ────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-base">🗑</div>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{message}</p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showVisitModal, setShowVisitModal]           = useState(false)
  const [showTreatmentEdit, setShowTreatmentEdit]     = useState(false)
  const [showTreatmentHistory, setShowTreatmentHistory] = useState(false)
  const [showBillingEdit, setShowBillingEdit]         = useState(false)
  const [showEditPatient, setShowEditPatient]         = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm]     = useState(false)
  const [billingDeleteTarget, setBillingDeleteTarget] = useState(null)
  const [visitDeleteTarget, setVisitDeleteTarget]       = useState(null)
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), [])

  useEffect(() => { fetchPatient() }, [id])

  async function fetchPatient() {
    setLoading(true)
    try { const res = await getPatient(id); setPatient(res.data) }
    catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading) return <div className="text-gray-400 dark:text-gray-500 text-center py-20">Loading...</div>
  if (!patient) return <div className="text-red-500 text-center py-20">Patient not found.</div>

  const b  = patient.billing
  const tp = patient.treatmentPlan

  return (
    <div>
      <button onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to patients
      </button>

      {/* ── Header card ── */}
      <div className={`${CARD} p-4 sm:p-6 mb-6`}>
        {/* Desktop: side by side | Mobile: stacked */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

          {/* Patient info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-blue-600 dark:text-blue-400 text-sm font-semibold">{patient.patientCode}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                Dr. {patient.assignedDoctor}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                patient.isActive
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {patient.isActive ? '● Treatment Ongoing' : '✓ Treatment Completed'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">{patient.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {patient.gender} · {patient.age} yrs · {new Date(patient.dob).toLocaleDateString('en-IN')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{patient.address}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.contactNumbers.map((n, i) => (
                <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">{n}</span>
              ))}
            </div>
            {patient.remarks && (
              <div className="mt-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Remarks: </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{patient.remarks}</span>
              </div>
            )}
          </div>

          {/* Action buttons — row on desktop, wrapping row on mobile */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
            <button
              onClick={async () => {
                try {
                  await updatePatient(patient.id, { isActive: !patient.isActive })
                  fetchPatient()
                } catch (err) { showToast('Error: ' + err.message, 'error') }
              }}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition border ${
                patient.isActive
                  ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={patient.isActive ? 'Mark treatment as completed' : 'Mark treatment as ongoing'}>
              {patient.isActive ? '🟢 Ongoing' : '✅ Completed'}
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm">
              🗑 Delete
            </button>
            <button onClick={() => setShowEditPatient(true)}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
              Edit Patient
            </button>
            <button onClick={() => setShowVisitModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
              + Add Visit
            </button>
          </div>

        </div>

        {/* Billing summary bar */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated Total</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">₹{b?.estimatedTotal?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Paid</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">₹{b?.totalPaid?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance Due</p>
            <p className={`text-lg font-semibold ${b?.balanceDue > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              ₹{b?.balanceDue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 p-1 rounded-lg w-full sm:w-fit">
        {['overview', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium capitalize transition text-center ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tab === 'overview' ? 'Treatment & Billing' : 'Visit History'}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Treatment Plan */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-white">Treatment Plan</h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowTreatmentHistory(true)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1">
                  🕓 History
                  {tp?.history?.length > 0 && (
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                      {tp.history.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setShowTreatmentEdit(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Upper Right', tp?.upperRight], ['Upper Left', tp?.upperLeft],
                ['Lower Right', tp?.lowerRight], ['Lower Left', tp?.lowerLeft]].map(([label, val]) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {val || <span className="text-gray-300 dark:text-gray-600 italic">Empty</span>}
                  </p>
                </div>
              ))}
            </div>
            {tp?.general && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">General</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{tp.general}</p>
              </div>
            )}
          </div>

          {/* Billing History */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-white">Billing History</h2>
              <button onClick={() => setShowBillingEdit(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Adjust</button>
            </div>
            {b?.history?.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No billing changes yet.</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {b?.history?.map((h) => (
                  <div key={h.id} className="flex flex-col gap-0.5 border-b border-gray-100 dark:border-gray-700 py-2 group">
                    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-xs">
                      <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}
                        <span className="text-gray-300 dark:text-gray-600">
                          {new Date(h.changedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 truncate">{h.comment || <span className="italic text-gray-300 dark:text-gray-600">—</span>}</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">₹{h.newBalance.toFixed(2)}</span>
                      <button
                        onClick={() => setBillingDeleteTarget(h.id)}
                        className="text-red-400 hover:text-red-600 transition-colors px-1"
                        title="Delete this entry"
                      >🗑</button>
                    </div>
                    {h.changedBy && (
                      <span className="text-xs text-blue-500 dark:text-blue-400 pl-0.5">{h.changedBy}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Visit History tab ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {patient.visits?.length === 0 ? (
            <div className={`text-center py-12 text-gray-400 dark:text-gray-500 ${CARD}`}>
              <p className="text-3xl mb-2">📋</p>
              <p>No visits recorded yet.</p>
            </div>
          ) : (
            patient.visits?.map((v, i) => (
              <div key={i} className={`${CARD} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {new Date(v.visitDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}{' '}<span className="ml-1 text-xs text-gray-400 dark:text-gray-500">{new Date(v.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{v.changedBy || ('Dr. ' + v.doctor)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.paymentDelta !== 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        v.paymentDelta > 0
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      }`}>
                        {v.paymentDelta > 0 ? `+₹${v.paymentDelta}` : `-₹${Math.abs(v.paymentDelta)}`}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      v.whatsappSent
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {v.whatsappSent ? '✓ WhatsApp sent' : 'No WhatsApp'}
                    </span>
                    <button
                      onClick={() => window.open(`/print/${patient.id}/${v.id}`, '_blank')}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Print prescription"
                    >
                      🖨 Print
                    </button>
                    <button
                      onClick={() => setVisitDeleteTarget(v.id)}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Delete this visit"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
                {v.treatmentDoneToday && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Treatment done</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{v.treatmentDoneToday}</p>
                  </div>
                )}
                {v.medicinesInstructions && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Instructions / Medicines</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{v.medicinesInstructions}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showDeleteConfirm  && <DeleteConfirmModal patient={patient} onClose={() => setShowDeleteConfirm(false)} onDeleted={() => navigate('/')} showToast={showToast} />}
      {showTreatmentHistory && <TreatmentHistoryModal treatmentPlan={tp} onClose={() => setShowTreatmentHistory(false)} onDeleted={() => { setShowTreatmentHistory(false); fetchPatient() }} />}
      {showEditPatient    && <EditPatientModal  patient={patient} onClose={() => setShowEditPatient(false)}    onSaved={() => { setShowEditPatient(false);    fetchPatient() }} showToast={showToast} />}
      {showVisitModal     && <VisitModal        patient={patient} onClose={() => setShowVisitModal(false)}     onSaved={() => { setShowVisitModal(false);     fetchPatient() }} showToast={showToast} />}
      {showTreatmentEdit  && <TreatmentModal    patient={patient} onClose={() => setShowTreatmentEdit(false)}  onSaved={() => { setShowTreatmentEdit(false);  fetchPatient() }} showToast={showToast} />}
      {showBillingEdit    && <BillingModal       patient={patient} onClose={() => setShowBillingEdit(false)}   onSaved={() => { setShowBillingEdit(false);   fetchPatient() }} showToast={showToast} />}

      {/* Billing history delete confirm */}
      {billingDeleteTarget && (
        <ConfirmDialog
          message="Delete this billing history entry?"
          onCancel={() => setBillingDeleteTarget(null)}
          onConfirm={async () => {
            const id = billingDeleteTarget
            setBillingDeleteTarget(null)
            try { await deleteBillingHistory(id); fetchPatient() }
            catch { showToast('Failed to delete billing entry.', 'error') }
          }}
        />
      )}

      {/* Visit delete confirm */}
      {visitDeleteTarget && (
        <ConfirmDialog
          message="Delete this visit? Its billing effect will be reversed."
          onCancel={() => setVisitDeleteTarget(null)}
          onConfirm={async () => {
            const id = visitDeleteTarget
            setVisitDeleteTarget(null)
            try { await deleteVisit(id); fetchPatient() }
            catch { showToast('Failed to delete visit.', 'error') }
          }}
        />
      )}

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: '', type: 'success' })} />
    </div>
  )
}

// ─── Visit Modal ─────────────────────────────────────────────────
function VisitModal({ patient, onClose, onSaved, showToast }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    treatmentDoneToday: '', medicinesInstructions: '', paymentDelta: '',
    includeTreatment: true, includeInstructions: true, includeDues: false,
  })
  const [saving, setSaving]   = useState(false)
  const [waStatus, setWaStatus] = useState(null)

  async function handleSave(sendWhatsApp) {
    setSaving(true)
    try {
      const payload = {
        patientId: patient.id,
        doctor: patient.assignedDoctor,
        changedBy: user?.displayName || patient.assignedDoctor,
        treatmentDoneToday: form.treatmentDoneToday,
        medicinesInstructions: form.medicinesInstructions,
        paymentDelta: form.paymentDelta,
        sendWhatsApp,
        includeTreatment: form.includeTreatment,
        includeInstructions: form.includeInstructions,
        includeDues: form.includeDues,
      }
      const res = await addVisit(payload)
      if (sendWhatsApp) {
        setWaStatus(res.data.whatsappSent ? 'sent' : res.data.whatsappError || 'not sent')
        setTimeout(onSaved, 1500)
      } else {
        onSaved()
      }
    } catch (err) { showToast('Error saving visit: ' + err.message, 'error') }
    setSaving(false)
  }

  // Toggle row component
  function Toggle({ label, checked, onChange }) {
    return (
      <label className="flex items-center justify-between cursor-pointer select-none py-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <div
          onClick={onChange}
          className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </label>
    )
  }

  return (
    <div className={MODAL_WRAP}>
      <div className={`${MODAL_BOX} max-w-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Add Visit — {patient.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="space-y-4">

          {/* Visit fields */}
          <div>
            <label className={LBL}>Treatment done today</label>
            <textarea className={FIELD} rows={3} placeholder="e.g. Root canal on upper left central incisor..."
              value={form.treatmentDoneToday} onChange={e => setForm({...form, treatmentDoneToday: e.target.value})} />
          </div>
          <div>
            <label className={LBL}>Medicines & Instructions</label>
            <textarea className={FIELD} rows={3} placeholder="e.g. Amoxicillin 500mg twice daily for 5 days..."
              value={form.medicinesInstructions} onChange={e => setForm({...form, medicinesInstructions: e.target.value})} />
          </div>
          <div>
            <label className={LBL}>Payment</label>
            <input type="number" className={FIELD} placeholder="+ to add charge  /  - for payment received (e.g. -500)"
              value={form.paymentDelta} onChange={e => setForm({...form, paymentDelta: e.target.value})} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Positive = new charge · Negative = payment received</p>
          </div>

          {/* WhatsApp message toggles */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">📱 WhatsApp message — include:</p>
            <Toggle label="Treatment done today" checked={form.includeTreatment}
              onChange={() => setForm({...form, includeTreatment: !form.includeTreatment})} />
            <Toggle label="Medicines & Instructions" checked={form.includeInstructions}
              onChange={() => setForm({...form, includeInstructions: !form.includeInstructions})} />
            <Toggle label="Dues reminder" checked={form.includeDues}
              onChange={() => setForm({...form, includeDues: !form.includeDues})} />
          </div>

          {waStatus && (
            <div className={`text-sm rounded-lg px-3 py-2 ${waStatus === 'sent' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
              {waStatus === 'sent'
                ? '✓ WhatsApp message sent!'
                : waStatus.includes('no contact numbers') || waStatus.includes('Could not send')
                  ? '⚠️ Visit saved, but WhatsApp failed — patient may not have WhatsApp on their number(s).'
                  : `⚠️ Visit saved. WhatsApp: ${waStatus}`}
            </div>
          )}

          {/* Three action buttons */}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className={BTN_CANCEL} disabled={saving}>Cancel</button>
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50">
              {saving ? 'Saving…' : '💾 Save only'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
              {saving ? 'Saving…' : '📱 Save + WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Treatment Modal ──────────────────────────────────────────────
function TreatmentModal({ patient, onClose, onSaved, showToast }) {
  const tp = patient.treatmentPlan
  const { user } = useAuth()
  const [form, setForm] = useState({
    upperRight: tp?.upperRight || '', upperLeft: tp?.upperLeft || '',
    lowerRight: tp?.lowerRight || '', lowerLeft: tp?.lowerLeft || '',
    general: tp?.general || '', comment: '', changedBy: user?.displayName || patient.assignedDoctor,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await updateTreatment(patient.id, form); onSaved() }
    catch (err) { showToast('Error: ' + err.message, 'error') }
    setSaving(false)
  }

  return (
    <div className={MODAL_WRAP}>
      <div className={`${MODAL_BOX} max-w-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Treatment Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['upperRight','Upper Right'],['upperLeft','Upper Left'],['lowerRight','Lower Right'],['lowerLeft','Lower Left']].map(([key, label]) => (
            <div key={key}>
              <label className={LBL}>{label}</label>
              <textarea className={FIELD} rows={2} value={form[key]}
                onChange={e => setForm({...form, [key]: e.target.value})} placeholder={`${label}...`} />
            </div>
          ))}
        </div>
        <div className="mb-3">
          <label className={LBL}>General (scaling, checkup etc)</label>
          <textarea className={FIELD} rows={2} value={form.general}
            onChange={e => setForm({...form, general: e.target.value})} placeholder="General notes..." />
        </div>
        <div className="mb-4">
          <label className={LBL}>Comment (like a commit message)</label>
          <input className={FIELD} value={form.comment}
            onChange={e => setForm({...form, comment: e.target.value})} placeholder="e.g. Updated after RCT session 2..." />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={BTN_CANCEL}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Billing Modal ────────────────────────────────────────────────
function BillingModal({ patient, onClose, onSaved, showToast }) {
  const b = patient.billing
  const { user } = useAuth()
  const [form, setForm] = useState({ estimatedTotal: b?.estimatedTotal || 0, totalPaid: b?.totalPaid || 0, comment: '', changedBy: user?.displayName || patient.assignedDoctor })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await updateBilling(patient.id, form); onSaved() }
    catch (err) { showToast('Error: ' + err.message, 'error') }
    setSaving(false)
  }

  return (
    <div className={MODAL_WRAP}>
      <div className={`${MODAL_BOX} max-w-md p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Adjust Billing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className={LBL}>Estimated Total (₹)</label>
            <input type="number" className={FIELD} value={form.estimatedTotal} onChange={e => setForm({...form, estimatedTotal: parseFloat(e.target.value)})} />
          </div>
          <div>
            <label className={LBL}>Total Paid (₹)</label>
            <input type="number" className={FIELD} value={form.totalPaid} onChange={e => setForm({...form, totalPaid: parseFloat(e.target.value)})} />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
            Balance Due: <span className="font-semibold text-red-500 dark:text-red-400">₹{(form.estimatedTotal - form.totalPaid).toFixed(2)}</span>
          </div>
          <div>
            <label className={LBL}>Comment</label>
            <input className={FIELD} value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} placeholder="e.g. Payment received on 30 March..." />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={BTN_CANCEL}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Treatment History Modal ──────────────────────────────────────
function TreatmentHistoryModal({ treatmentPlan, onClose, onDeleted }) {
  const history  = treatmentPlan?.history || []
  const QUADRANTS = [['upperRight','Upper Right'],['upperLeft','Upper Left'],['lowerRight','Lower Right'],['lowerLeft','Lower Left'],['general','General']]
  const [confirmTarget, setConfirmTarget] = useState(null) // historyId pending delete
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteEntry(historyId) {
    setDeleting(true)
    try {
      await deleteTreatmentHistory(historyId)
      onDeleted()
    } catch {
      setConfirmTarget(null)
      setDeleting(false)
      // surface error inside modal via a small inline banner — see below
    }
    setDeleting(false)
  }

  return (
    <div className={MODAL_WRAP}>
      <div className={`${MODAL_BOX} max-w-2xl max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Treatment Plan History</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{history.length} previous snapshot{history.length !== 1 ? 's' : ''} · current plan always shown</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1">
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-6">

              {/* ── Current live plan — always pinned at top ── */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Current</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Live plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {history[0]?.changedBy && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                          {history[0].changedBy}
                        </span>
                      )}
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUADRANTS.map(([key, label]) => treatmentPlan?.[key] ? (
                      <div key={key} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-green-100 dark:border-green-900">
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{treatmentPlan[key]}</p>
                      </div>
                    ) : null)}
                    {QUADRANTS.every(([key]) => !treatmentPlan?.[key]) && (
                      <p className="text-xs text-gray-400 italic col-span-2">Treatment plan is empty.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Past snapshots ── */}
              {history.length === 0 ? (
                <div className="pl-10">
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No previous snapshots. History will appear here after each edit.</p>
                </div>
              ) : history.map(h => (
                <div key={h.id} className="relative pl-10 group">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(h.changedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                          {h.changedBy}
                        </span>
                        <button
                          onClick={() => setConfirmTarget(h.id)}
                          className="text-red-400 hover:text-red-600 transition-colors text-xs px-1"
                          title="Delete this snapshot"
                        >🗑</button>
                      </div>
                    </div>
                    {h.comment && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 border-l-2 border-blue-200 dark:border-blue-700 pl-2">{h.comment}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {QUADRANTS.map(([key, label]) => h[key] ? (
                        <div key={key} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-600">
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">{h[key]}</p>
                        </div>
                      ) : null)}
                      {QUADRANTS.every(([key]) => !h[key]) && (
                        <p className="text-xs text-gray-400 italic col-span-2">All fields were empty at this point.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className={BTN_CANCEL + ' w-full'}>Close</button>
        </div>
      </div>

      {confirmTarget && (
        <ConfirmDialog
          message="Delete this treatment plan snapshot?"
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => handleDeleteEntry(confirmTarget)}
        />
      )}
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────
function DeleteConfirmModal({ patient, onClose, onDeleted, showToast }) {
  const [confirming, setConfirming] = useState(false)
  const [typedName, setTypedName]   = useState('')
  const [deleting, setDeleting]     = useState(false)
  const nameMatches = typedName.trim().toLowerCase() === patient.name.trim().toLowerCase()

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePatient(patient.id)
      onDeleted()
    } catch (err) {
      showToast('Failed to delete patient: ' + err.message, 'error')
      setDeleting(false)
    }
  }

  return (
    <div className={MODAL_WRAP}>
      <div className={`${MODAL_BOX} max-w-md p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-lg">🗑</div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">Delete Patient</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">{patient.patientCode}</p>
          </div>
        </div>

        {!confirming ? (
          <>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-5">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">This action cannot be undone.</p>
              <p className="text-xs text-red-500 dark:text-red-400">
                All data for <span className="font-semibold">{patient.name}</span> will be permanently deleted —
                visits, billing history, treatment plan, and everything else.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className={BTN_CANCEL}>Cancel</button>
              <button onClick={() => setConfirming(true)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition">
                Continue →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Type <span className="font-semibold text-gray-800 dark:text-white">{patient.name}</span> to confirm deletion:
            </p>
            <input
              className={`${FIELD} mb-4`}
              placeholder={patient.name}
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={onClose} className={BTN_CANCEL}>Cancel</button>
              <button onClick={handleDelete} disabled={!nameMatches || deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Edit Patient Modal ───────────────────────────────────────────
const COUNTRY_CODES = [
  { name: 'India', code: 'IN', dial: '+91' }, { name: 'USA', code: 'US', dial: '+1' },
  { name: 'UK', code: 'GB', dial: '+44' },    { name: 'UAE', code: 'AE', dial: '+971' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966' }, { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'Australia', code: 'AU', dial: '+61' },     { name: 'Singapore', code: 'SG', dial: '+65' },
  { name: 'Nepal', code: 'NP', dial: '+977' },        { name: 'Bangladesh', code: 'BD', dial: '+880' },
  { name: 'Pakistan', code: 'PK', dial: '+92' },      { name: 'Sri Lanka', code: 'LK', dial: '+94' },
  { name: 'Other', code: 'XX', dial: '+' },
]

function PhoneInput({ value, onChange, placeholder }) {
  const [dialCode, setDialCode] = useState('+91')
  const localPart = (() => {
    if (!value) return ''
    if (dialCode !== '+' && value.startsWith(dialCode)) return value.slice(dialCode.length).replace(/\D/g, '')
    return value.replace(/^\+\d{1,4}/, '').replace(/\D/g, '')
  })()
  function handleNumber(e) {
    if (dialCode === '+') onChange(e.target.value.replace(/\s+/g, ''))
    else onChange(dialCode + e.target.value.replace(/\s+/g, '').replace(/\D/g, ''))
  }
  function handleDial(e) {
    const newDial = e.target.value; setDialCode(newDial)
    if (newDial === '+') { onChange(''); return }
    onChange(newDial + (value ? value.replace(/^\+\d{1,4}/, '').replace(/\D/g, '') : ''))
  }
  const inputCls = FIELD.replace('w-full', 'flex-1')
  const selCls   = "border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div className="flex gap-2">
      <select value={dialCode} onChange={handleDial} className={selCls}>
        {COUNTRY_CODES.map(c => <option key={c.code + c.dial} value={c.dial}>{c.name} ({c.dial})</option>)}
      </select>
      <input type="tel" className={inputCls}
        placeholder={dialCode === '+' ? 'e.g. +1234567890' : placeholder || 'Phone number'}
        value={dialCode === '+' ? (value || '') : localPart} onChange={handleNumber} />
    </div>
  )
}

function EditPatientModal({ patient, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({
    name: patient.name, gender: patient.gender, age: patient.age,
    dob: new Date(patient.dob).toISOString().split('T')[0],
    address: patient.address, country: patient.country || 'India',
    assignedDoctor: patient.assignedDoctor,
    contactNumbers: [...(patient.contactNumbers || ['', '']), '', ''].slice(0, 2),
    remarks: patient.remarks || '',
  })
  const [saving, setSaving] = useState(false)
  const handleChange = e => setForm({...form, [e.target.name]: e.target.value})
  function handlePhone(i, val) {
    const nums = [...form.contactNumbers]; nums[i] = val.replace(/\s+/g, '')
    setForm({...form, contactNumbers: nums})
  }
  async function handleSave() {
    setSaving(true)
    try {
      await updatePatient(patient.id, {
        ...form, age: parseInt(form.age), dob: new Date(form.dob),
        contactNumbers: form.contactNumbers.map(n => n.replace(/\s+/g, '')).filter(n => n.trim())
      }); onSaved()
    } catch (err) { showToast('Error: ' + err.message, 'error') }
    setSaving(false)
  }

  return (
    <div className={`${MODAL_WRAP} overflow-y-auto`}>
      <div className={`${MODAL_BOX} max-w-lg p-6 my-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Patient — {patient.patientCode}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LBL}>Full Name</label><input name="name" value={form.name} onChange={handleChange} className={FIELD} /></div>
            <div><label className={LBL}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className={FIELD}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LBL}>Age</label><input name="age" type="number" value={form.age} onChange={handleChange} className={FIELD} /></div>
            <div><label className={LBL}>Date of Birth</label><input name="dob" type="date" value={form.dob} onChange={handleChange} className={FIELD} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LBL}>Country</label>
              <select name="country" value={form.country} onChange={handleChange} className={FIELD}>
                {COUNTRY_CODES.filter(c => c.code !== 'XX').map(c => <option key={c.code}>{c.name}</option>)}
                <option>Other</option>
              </select>
            </div>
            <div><label className={LBL}>Assigned Doctor</label>
              <select name="assignedDoctor" value={form.assignedDoctor} onChange={handleChange} className={FIELD}>
                <option value="Vanita Goenka">Dr. Vanita Goenka</option>
                <option value="Rajneesh Goenka">Dr. Rajneesh Goenka</option>
              </select>
            </div>
          </div>
          <div><label className={LBL}>Address</label><textarea name="address" value={form.address} onChange={handleChange} className={FIELD} rows={2} /></div>
          <div><label className={LBL}>Contact Number 1</label><PhoneInput value={form.contactNumbers[0]} onChange={v => handlePhone(0, v)} placeholder="Primary" /></div>
          <div><label className={LBL}>Contact Number 2 (optional)</label><PhoneInput value={form.contactNumbers[1]} onChange={v => handlePhone(1, v)} placeholder="Secondary" /></div>
          <div><label className={LBL}>Remarks</label><textarea name="remarks" value={form.remarks} onChange={handleChange} className={FIELD} rows={2} /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className={BTN_CANCEL}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}