import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="container-page py-24 text-center text-omega-purple">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/brothers/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
