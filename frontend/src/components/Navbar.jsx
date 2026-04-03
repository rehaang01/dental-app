import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="text-2xl">🦷</span>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">Goenka's Dental</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5">Care Centre, Varanasi</p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <Link
          to="/patients/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + New Patient
        </Link>
      </div>
    </nav>
  )
}