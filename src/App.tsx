// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { SessionManager } from './components/SessionManager'
import { PageTitleProvider } from './contexts/PageTitleContext'
import NetworkAlert from './components/NetworkAlert'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import Login from './components/Login'
import './App.css'
import AdminDashboard from './pages/AdminDashboard'
import AdminCallPage from './pages/AdminCallPage'
import AdminCounterPage from './pages/AdminCounterPage'
import AdminTicketArchivedPage from './pages/AdminTicketArchived'
import AdminIssuedProcessedByHourPage from './pages/AdminIssuedProcessedByHourPage'
import AdminServiceReport from './pages/AdminServiceReport'
import EmployeeReportPage from './pages/EmployeeReportPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminRegistrationPage from './pages/AdminRegistrationPage'

function AppContent() {
  const networkStatus = useNetworkStatus();

  return (
    <>
      {/* Network Alert - hiển thị trên toàn app */}
      <NetworkAlert {...networkStatus} />
      
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/admin-dashboard" replace />
          </ProtectedRoute>
        } />

        <Route path="/admin-call" element={
          <ProtectedRoute>
            <AdminCallPage />
          </ProtectedRoute>
        } />

        <Route path="/admin-dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin-counter" element={
          <ProtectedRoute>
            <AdminCounterPage />
          </ProtectedRoute>
        } />

        <Route path="/admin-ticket-archived" element={
          <ProtectedRoute>
            <AdminTicketArchivedPage />
          </ProtectedRoute>
        } />

        <Route path="/admin-issued-processed-by-hour" element={
          <ProtectedRoute>
            <AdminIssuedProcessedByHourPage />
          </ProtectedRoute>
        } />

        <Route path="/admin-service-report" element={
          <ProtectedRoute>
            <AdminServiceReport />
          </ProtectedRoute>
        } />

        <Route path="/employee-report" element={
          <ProtectedRoute>
            <EmployeeReportPage />
          </ProtectedRoute>
        } />

        <Route path="/admin-settings" element={
          <ProtectedRoute>
            <AdminSettingsPage />
          </ProtectedRoute>
        } />

        <Route path="/admin-registration" element={
          <ProtectedRoute>
            <AdminRegistrationPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <PageTitleProvider>
        <SessionManager>
          <AppContent />
        </SessionManager>
      </PageTitleProvider>
    </Router>
  )
}

export default App