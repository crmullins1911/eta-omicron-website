import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import {
  Home,
  About,
  Events,
  Media,
  Committees,
  CommitteeDetail,
  News,
  ChapterHouse,
  EssayContest,
  EssayApply,
  Status,
  BrothersLogin,
  BrothersDashboard,
  NotFound,
} from './routes'

// Every page except Home is code-split (see src/routes.js), so a visitor only downloads the
// JavaScript for the page they are looking at.

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
        <Route path="/news" element={<News />} />
        <Route path="/chapter-house" element={<ChapterHouse />} />
        <Route path="/essay-contest" element={<EssayContest />} />
        <Route path="/essay-contest/apply" element={<EssayApply />} />
        <Route path="/status" element={<Status />} />

        <Route path="/brothers/login" element={<BrothersLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/brothers" element={<BrothersDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
