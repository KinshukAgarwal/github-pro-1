import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import DashboardPage from '@/pages/DashboardPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ProfilePage from '@/pages/ProfilePage'
import RecommendationsPage from '@/pages/RecommendationsPage'
import ReadmePage from '@/pages/ReadmePage'
import SettingsPage from '@/pages/SettingsPage'
import RoadmapPage from '@/pages/RoadmapPage'
import RoadmapDetailPage from '@/pages/RoadmapDetailPage'

import LearnEmbedPage from '@/pages/LearnEmbedPage'
import SharedProfilePage from '@/pages/SharedProfilePage'
import EmbedProfilePage from '@/pages/EmbedProfilePage'



import LoginPage from '@/pages/LoginPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username?"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/readme"
            element={
              <ProtectedRoute>
                <ReadmePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap/:id"
            element={
              <ProtectedRoute>
                <RoadmapDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <LearnEmbedPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Public routes - no authentication required */}
        <Route path="/share/:shareToken" element={<SharedProfilePage />} />
        <Route path="/embed/:shareToken" element={<EmbedProfilePage />} />
      </Routes>
      <Toaster position="top-right" />
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
