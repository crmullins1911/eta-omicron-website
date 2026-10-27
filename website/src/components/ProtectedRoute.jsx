import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthError from './AuthError'

export default function ProtectedRoute() {
  const { session, loading, error } = useAuth()
  const location = useLocation()

  if (error) return <AuthError error={error} />

  if (loading) {
    return (
      <div className="container-page py-24 text-center text-ink" role="status">
        Checking your sign-in...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/brothers/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
