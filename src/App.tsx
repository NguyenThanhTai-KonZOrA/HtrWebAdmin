import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleBasedRoute from './components/RoleBasedRoute'
import { SessionManager } from './components/SessionManager'
import { PageTitleProvider } from './contexts/PageTitleContext'
import { AppDataProvider } from './contexts/AppDataContext'
import { AppLoadingProvider } from './contexts/AppLoadingContext'
import NetworkAlert from './components/NetworkAlert'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { useTokenValidator } from './hooks/useTokenValidator'
import Login from './components/Login'
import './App.css'
import AdminRegistrationPage from './pages/AdminRegistrationPage'
import DeviceMappingSettingsPage from './pages/DeviceMappingSettingsPage'
import { Permission } from './constants/roles'
import AdminSettingsPage from './pages/AdminSettingsPage'

function AppContent() {
  const networkStatus = useNetworkStatus();
  
  // Validate token periodically
  useTokenValidator();

  return (
    <>
      {/* Network Alert - Show network status all application */}
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

        <Route path="/admin-device-mapping" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_DEVICE_MAPPING}
              fallbackPath="/admin-registration"
              showAccessDenied={true}
            >
              <DeviceMappingSettingsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-settings" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_DEVICE_MAPPING}
              fallbackPath="/admin-settings"
              showAccessDenied={true}
            >
              <AdminSettingsPage />
            </RoleBasedRoute>
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
          <AppLoadingProvider>
            <SessionManager>
              <AppContent />
            </SessionManager>
          </AppLoadingProvider>
        </PageTitleProvider>
      </AppDataProvider>
    </Router>
  )
}

export default App