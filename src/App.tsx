// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { SessionManager } from './components/SessionManager'
import { PageTitleProvider } from './contexts/PageTitleContext'
import { AppDataProvider } from './contexts/AppDataContext'
import NetworkAlert from './components/NetworkAlert'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import Login from './components/Login'
import './App.css'
import AdminCounterPage from './pages/AdminCounterPage'
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
            <Navigate to="/admin-registration" replace />
          </ProtectedRoute>
        } />

        <Route path="/admin-registration" element={
          <ProtectedRoute>
            <AdminRegistrationPage />
          </ProtectedRoute>
        } />

       <Route path="/admin-counter" element={
          <ProtectedRoute>
            <AdminCounterPage />
          </ProtectedRoute>
        } />

      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppDataProvider>
        <PageTitleProvider>
          <SessionManager>
            <AppContent />
          </SessionManager>
        </PageTitleProvider>
      </AppDataProvider>
    </Router>
  )
}

export default App