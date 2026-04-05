import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [showLogout, setShowLogout] = useState(false)
  const dropdownRef = useRef(null)

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

  // ✅ FIX: close dropdown when clicking anywhere outside it.
  // The old backdrop div approach broke because the sticky nav and the
  // backdrop shared z-index z-40, so the nav intercepted clicks first.
  useEffect(() => {
    if (!showLogout) return
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogout(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLogout])

  async function handleLogout() {
    setShowLogout(false)
    await logout()
  }
  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0">
            <img src="/logo.jpg" alt="Goenka's Dental" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">Goenka's Dental Care Centre</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5">Amritsar, Punjab</p>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {/* New Patient */}
          <Link
            to="/patients/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + New Patient
          </Link>

          {/* User avatar / logout */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLogout(s => !s)}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-bold text-gray-600 dark:text-gray-300"
              title={user?.displayName}
            >
              {/* Pick first letter of the name part after "Dr. " */}
              {(user?.displayName?.replace(/^Dr\.\s*/i, '')?.[0]?.toUpperCase()) ?? '👤'}
            </button>

            {showLogout && (
              <div className="absolute right-0 top-11 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 w-52">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{user?.displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">@{user?.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
                >
                  <span>🚪</span> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}