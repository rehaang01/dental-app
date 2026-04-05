import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPatient } from '../api'

const COUNTRY_CODES = [
  { name: 'India', code: 'IN', dial: '+91' },
  { name: 'USA', code: 'US', dial: '+1' },
  { name: 'UK', code: 'GB', dial: '+44' },
  { name: 'UAE', code: 'AE', dial: '+971' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966' },
  { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'Australia', code: 'AU', dial: '+61' },
  { name: 'Singapore', code: 'SG', dial: '+65' },
  { name: 'Germany', code: 'DE', dial: '+49' },
  { name: 'France', code: 'FR', dial: '+33' },
  { name: 'Nepal', code: 'NP', dial: '+977' },
  { name: 'Bangladesh', code: 'BD', dial: '+880' },
  { name: 'Pakistan', code: 'PK', dial: '+92' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94' },
  { name: 'Other', code: 'XX', dial: '+' },
]

function PhoneInput({ value, onChange, placeholder }) {
  const [dialCode, setDialCode] = useState('+91')

  const localPart = (() => {
    if (!value) return ''
    if (dialCode !== '+' && value.startsWith(dialCode))
      return value.slice(dialCode.length).replace(/\D/g, '')
    return value.replace(/^\+\d{1,4}/, '').replace(/\D/g, '')
  })()

  function handleNumber(e) {
    if (dialCode === '+') onChange(e.target.value.replace(/\s+/g, ''))
    else onChange(dialCode + e.target.value.replace(/\s+/g, '').replace(/\D/g, ''))
  }

  function handleDial(e) {
    const newDial = e.target.value
    setDialCode(newDial)
    if (newDial === '+') { onChange(''); return }
    const digits = value ? value.replace(/^\+\d{1,4}/, '').replace(/\D/g, '') : ''
    onChange(newDial + digits)
  }

  const inputCls = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 flex-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const selectCls = "border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="flex gap-2">
      <select value={dialCode} onChange={handleDial} className={selectCls}>
        {COUNTRY_CODES.map(c => (
          <option key={c.code + c.dial} value={c.dial}>{c.name} ({c.dial})</option>
        ))}
      </select>
      <input
        type="tel"
        className={inputCls}
        placeholder={dialCode === '+' ? 'e.g. +1234567890' : placeholder || 'Phone number'}
        value={dialCode === '+' ? (value || '') : localPart}
        onChange={handleNumber}
      />
    </div>
  )
}

export default function NewPatient() {
  const navigate = useNavigate()
  const nowIST   = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  const todayIST = nowIST.toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '', gender: '', age: '', dob: '',
    address: '', country: 'India',
    assignedDoctor: '',
    contactNumbers: ['', ''],
    remarks: '',
    registrationDate: todayIST,
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  function handlePhone(i, val) {
    const nums = [...form.contactNumbers]
    nums[i] = val.replace(/\s+/g, '')
    setForm({ ...form, contactNumbers: nums })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.contactNumbers[0] || form.contactNumbers[0].replace(/\D/g, '').length < 5) {
      alert('Please enter a primary contact number'); return
    }
    setSaving(true)
    try {
      const res = await createPatient({
        ...form,
        contactNumbers: form.contactNumbers.map(n => n.replace(/\s+/g, '')).filter(n => n.trim())
      })
      navigate(`/patients/${res.data.id}`)
    } catch (err) { alert('Error creating patient: ' + err.message) }
    setSaving(false)
  }

  const field = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl   = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button type="button" onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to patients
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">New Patient</h1>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Full Name *</label>
            <input name="name" required value={form.name} onChange={handleChange} className={field} placeholder="Patient name" />
          </div>
          <div>
            <label className={lbl}>Gender *</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={field} required>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Age *</label>
            <input name="age" type="number" required value={form.age} onChange={handleChange} className={field} placeholder="Age" />
          </div>
          <div>
            <label className={lbl}>Date of Birth *</label>
            <input name="dob" type="date" required value={form.dob} onChange={handleChange} className={field} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Registration Date</label>
            <input name="registrationDate" type="date" required value={form.registrationDate} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={lbl}>Country</label>
            <select name="country" value={form.country} onChange={handleChange} className={field} required>
              {COUNTRY_CODES.filter(c => c.code !== 'XX').map(c => <option key={c.code}>{c.name}</option>)}
              <option>Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Address *</label>
          <textarea name="address" required value={form.address} onChange={handleChange} className={field} rows={2} placeholder="Full address" />
        </div>

        <div>
          <label className={lbl}>Assigned Doctor *</label>
          <select name="assignedDoctor" value={form.assignedDoctor} onChange={handleChange} className={field} required>
            <option value="">Select Doctor</option>
            <option value="Vanita Goenka">Dr. Vanita Goenka</option>
            <option value="Rajneesh Goenka">Dr. Rajneesh Goenka</option>
          </select>
        </div>

        <div>
          <label className={lbl}>Contact Number 1 (primary) *</label>
          <PhoneInput value={form.contactNumbers[0]} onChange={v => handlePhone(0, v)} placeholder="Primary number" />
          {!form.contactNumbers[0] && <p className="text-xs text-red-400 mt-1">Primary contact is required</p>}
        </div>
        <div>
          <label className={lbl}>Contact Number 2 (optional)</label>
          <PhoneInput value={form.contactNumbers[1]} onChange={v => handlePhone(1, v)} placeholder="Secondary number" />
        </div>

        <div>
          <label className={lbl}>Remarks / Notes (optional)</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} className={field} rows={2} placeholder="Any initial notes about the patient" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Patient'}
        </button>
      </form>
    </div>
  )
}