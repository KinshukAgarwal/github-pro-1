import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50"
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Github className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">
            GitHub Analytics
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar_url}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || user?.login}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link
                  to="/settings"
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="btn-primary flex items-center space-x-2"
            >
              <Github className="h-4 w-4" />
              <span>Sign in with GitHub</span>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
