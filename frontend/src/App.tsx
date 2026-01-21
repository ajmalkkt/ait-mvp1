// frontend/src/App.tsx
// Main app with routing

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import AuthLayout from './layouts/AuthLayout'
import MyActionItems from './pages/MyActionItems'
import ActionItemDetail from './pages/ActionItemDetail'
import ProjectsPage from './pages/ProjectsPage'
import TeamsPage from './pages/TeamsPage'
import NotificationsPage from './pages/NotificationsPage'
import AuditPage from './pages/AuditPage'
import CompliancePage from './pages/CompliancePage'
import TeamDashboard from './pages/TeamDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <Routes>
            <Route path="/login" element={<AuthLayout />} />
            {/* Protected routes */}
            <Route path="/action-items" element={<MyActionItems />} />
            <Route path="/action-items/:id" element={<ActionItemDetail />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId/dashboard" element={<TeamDashboard />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/" element={<Navigate to="/action-items" replace />} />
            <Route path="*" element={<Navigate to="/action-items" replace />} />
          </Routes>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
