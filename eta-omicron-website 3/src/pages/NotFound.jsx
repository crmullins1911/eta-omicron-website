import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-omega-purple">404</h1>
      <p className="mt-2 text-gray-600">We couldn't find that page.</p>
      <Link to="/" className="mt-6 inline-block text-omega-purple font-semibold underline">
        Back to Home
      </Link>
    </div>
  )
}
