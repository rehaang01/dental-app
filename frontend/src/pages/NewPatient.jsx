import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPatient } from '../api'
const nowIST = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
const todayIST = nowIST.toISOString().split('T')[0]
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

export default function NewPatient() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const nowIST = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handlePhone(i, val) {
    const nums = [...form.contactNumbers]
    // Always strip spaces when storing
    nums[i] = val.replace(/\s+/g, '')
    setForm({ ...form, contactNumbers: nums })
  }

  async function handleSubmit(e) {
    e.preventDefault()
      if (!form.contactNumbers[0] || form.contactNumbers[0].replace(/\D/g, '').length < 5) {
      alert('Please enter a primary contact number')
      return
    }
    setSaving(true)
    try {
      const data = {
        ...form,
        contactNumbers: form.contactNumbers
          .map(n => n.replace(/\s+/g, ''))  // strip spaces
          .filter(n => n.trim() !== '')
      }
      const res = await createPatient(data)
      navigate(`/patients/${res.data.id}`)
    } catch (err) {
      alert('Error creating patient: ' + err.message)
    }
    setSaving(false)
  }

  const field = "border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const label = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">New Patient</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Full Name *</label>
            <input name="name" required value={form.name} onChange={handleChange} className={field} placeholder="Patient name" />
          </div>
          <div>
            <label className={label}>Gender *</label>
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
            <label className={label}>Age *</label>
            <input name="age" type="number" required value={form.age} onChange={handleChange} className={field} placeholder="Age" />
          </div>
          <div>
            <label className={label}>Date of Birth *</label>
            <input name="dob" type="date" required value={form.dob} onChange={handleChange} className={field} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Registration Date</label>
            <input name="registrationDate" type="date" required value={form.registrationDate} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>Country</label>
            <select name="country" value={form.country} onChange={handleChange} className={field} required>
              {COUNTRY_CODES.filter(c => c.code !== 'XX').map(c => (
                <option key={c.code}>{c.name}</option>
              ))}
              <option>Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Address *</label>
          <textarea name="address" required value={form.address} onChange={handleChange} className={field} rows={2} placeholder="Full address" />
        </div>

        <div>
          <label className={label}>Assigned Doctor *</label>
          <select name="assignedDoctor" value={form.assignedDoctor} onChange={handleChange} className={field} required>
            <option value="">Select Doctor</option>
            <option value="Vanita Goenka">Dr. Vanita Goenka</option>
            <option value="Rajneesh Goenka">Dr. Rajneesh Goenka</option>
          </select>
        </div>

        <div>
          <label className={label}>Contact Number 1 (primary) *</label>
          <PhoneInput
            value={form.contactNumbers[0]}
            onChange={val => handlePhone(0, val)}
            placeholder="Primary number"
            required
          />
          {!form.contactNumbers[0] && <p className="text-xs text-red-400 mt-1">Primary contact is required</p>}
        </div>
        <div>
          <label className={label}>Contact Number 2 (optional)</label>
          <PhoneInput
            value={form.contactNumbers[1]}
            onChange={val => handlePhone(1, val)}
            placeholder="Secondary number"
          />
        </div>

        <div>
          <label className={label}>Remarks / Notes (optional)</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} className={field} rows={2} placeholder="Any initial notes about the patient" />
        </div>

        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Patient'}
        </button>
      </form>
    </div>
  )
}