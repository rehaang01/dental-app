import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPatients, getDashboard } from '../api'

const SORT_OPTIONS = [
  { key: 'patientCode', label: 'ID' },
  { key: 'name',        label: 'Name' },
  { key: 'assignedDoctor', label: 'Doctor' },
  { key: 'balance',     label: 'Balance' },
]

export default function PatientList() {
  const [patients, setPatients]         = useState([])
  const [stats, setStats]               = useState(null)
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [sortKey, setSortKey]           = useState('patientCode')
  const [sortDir, setSortDir]           = useState('asc')

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchPatients() }, [search])

  async function fetchStats() {
    setStatsLoading(true)
    try { const res = await getDashboard(); setStats(res.data) }
    catch (err) { console.error(err) }
    setStatsLoading(false)
  }

  async function fetchPatients() {
    setLoading(true)
    try { const res = await getPatients(search); setPatients(res.data) }
    catch (err) { console.error(err) }
    setLoading(false)
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    return [...patients].sort((a, b) => {
      let av, bv
      if (sortKey === 'balance') {
        av = a.billing?.balanceDue ?? 0
        bv = b.billing?.balanceDue ?? 0
        return sortDir === 'asc' ? av - bv : bv - av
      }
      av = (a[sortKey] || '').toString().toLowerCase()
      bv = (b[sortKey] || '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [patients, sortKey, sortDir])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={statsLoading} icon="🗓️" label="Today's Visits"
          value={stats?.todayVisits ?? '—'}
          trend={stats?.todayVisits > 0 ? `${stats.todayVisits} patient${stats.todayVisits !== 1 ? 's' : ''} seen` : 'No visits yet'}
          accent="blue" />
        <StatCard loading={statsLoading} icon="💳" label="Outstanding Dues"
          value={stats ? `₹${Number(stats.totalDues).toLocaleString('en-IN')}` : '—'}
          trend={stats?.totalDues > 0 ? 'Pending collection' : 'All clear ✓'}
          accent={stats?.totalDues > 0 ? 'red' : 'green'} />
        <StatCard loading={statsLoading} icon="👩‍⚕️" label="Dr. Vanita"
          value={stats?.drVanitaCount ?? '—'} trend="Active patients" accent="violet" />
        <StatCard loading={statsLoading} icon="👨‍⚕️" label="Dr. Rajneesh"
          value={stats?.drRajneeshCount ?? '—'} trend="Active patients" accent="violet" />
      </div>

      {/* ── Recent Visits ── */}
      {!statsLoading && stats?.recentVisits?.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Recent Visits</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {stats.recentVisits.map(v => (
              <Link key={v.id} to={`/patients/${v.patient.id}`}
                className="flex-shrink-0 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400">{v.patient.patientCode}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {v.patient.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Dr. {v.doctor}</p>
                {v.treatmentDoneToday && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate border-t border-gray-100 dark:border-gray-700 pt-2">
                    {v.treatmentDoneToday}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Patient Table ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            All Patients
            {!loading && <span className="ml-2 normal-case font-normal text-gray-400 dark:text-gray-500">({patients.length})</span>}
          </h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">🔍</span>
            <input type="text" placeholder="Search name, ID or phone…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : patients.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-5xl mb-3">🦷</p>
            <p className="text-base font-medium text-gray-500 dark:text-gray-400">
              {search ? 'No patients match your search.' : 'No patients yet. Add your first one!'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {[
                    { key: 'patientCode', label: 'ID' },
                    { key: 'name',        label: 'Name' },
                    { key: 'assignedDoctor', label: 'Doctor' },
                    { key: null,          label: 'Contact' },
                    { key: 'balance',     label: 'Balance' },
                  ].map(col => (
                    <th key={col.label}
                      className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide select-none ${
                        col.key
                          ? 'text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                      onClick={() => col.key && handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1.5">
                        {col.label}
                        {col.key && (
                          <span className="flex flex-col leading-none">
                            <span className={`text-[9px] leading-none ${sortKey === col.key && sortDir === 'asc' ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}>▲</span>
                            <span className={`text-[9px] leading-none ${sortKey === col.key && sortDir === 'desc' ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}>▼</span>
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {sorted.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                        {p.patientCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">{p.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">Dr. {p.assignedDoctor}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.contactNumbers?.[0] || '—'}</td>
                    <td className="px-5 py-3.5">
                      {p.billing?.balanceDue > 0 ? (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                          ₹{p.billing.balanceDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                          Clear
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/patients/${p.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all">
                        Open <span className="text-[10px]">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────
const accents = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-100 dark:border-blue-800/40',     val: 'text-blue-700 dark:text-blue-400',     sub: 'text-blue-500/70 dark:text-blue-400/60',     dot: 'bg-blue-400'   },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-100 dark:border-red-800/40',       val: 'text-red-600 dark:text-red-400',       sub: 'text-red-400/80 dark:text-red-400/60',       dot: 'bg-red-400'    },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-100 dark:border-green-800/40',   val: 'text-green-700 dark:text-green-400',   sub: 'text-green-500/70 dark:text-green-400/60',   dot: 'bg-green-400'  },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40', val: 'text-violet-700 dark:text-violet-400', sub: 'text-violet-500/70 dark:text-violet-400/60', dot: 'bg-violet-400' },
}

function StatCard({ icon, label, value, trend, accent = 'blue', loading }) {
  const a = accents[accent] || accents.blue
  return (
    <div className={`${a.bg} border ${a.border} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className={`w-2 h-2 rounded-full ${a.dot}`} />
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-lg bg-white/50 dark:bg-white/5 animate-pulse" />
      ) : (
        <p className={`text-3xl font-bold tracking-tight ${a.val}`}>{value}</p>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</p>
        {trend && <p className={`text-xs mt-0.5 ${a.sub}`}>{trend}</p>}
      </div>
    </div>
  )
}

// ─── Table Skeleton ───────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
          <div className="h-5 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-28 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse ml-auto" />
        </div>
      ))}
    </div>
  )
}