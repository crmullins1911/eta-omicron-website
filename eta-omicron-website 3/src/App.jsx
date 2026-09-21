import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import About from './pages/About'
import Events from './pages/Events'
import Media from './pages/Media'
import Committees from './pages/committees/Committees'
import CommitteeDetail from './pages/committees/CommitteeDetail'
import BrothersLogin from './pages/brothers/Login'
import BrothersDashboard from './pages/brothers/Dashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/committees" element={<Committees />} />
        <Route path="/committees/:slug" element={<CommitteeDetail />} />
        <Route path="/media" element={<Media />} />

        <Route path="/brothers/login" element={<BrothersLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/brothers" element={<BrothersDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
