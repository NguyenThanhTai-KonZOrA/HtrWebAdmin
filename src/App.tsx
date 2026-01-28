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
import AdminAuditLogsPage from './pages/AdminAuditLogsPage'
import AdminMembershipLogsPage from './pages/AdminMembershipLogsPage'
import AdminEmployeePage from './pages/AdminEmployeePage'
import AdminPermissionPage from './pages/AdminPermissionPage'
import AdminRolePage from './pages/AdminRolePage'
import AdminManageDevicePage from './pages/AdminManageDevicePage'
import AdminSyncIncomeDocumentPage from './pages/AdminSyncIncomeDocumentPage'
import AdminRegistrationReport from './pages/AdminRegistrationReport'
import AdminCustomerConfirmationPage from './pages/AdminCustomerConfirmationPage'

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

        <Route path="/admin-audit-logs" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_AUDIT_LOGS}
              fallbackPath="/admin-audit-logs"
              showAccessDenied={true}
            >
              <AdminAuditLogsPage />
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

        <Route path="/admin-member-audit-logs" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_REPORTS}
              fallbackPath="/admin-member-audit-logs"
              showAccessDenied={true}
            >
              <AdminMembershipLogsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-roles" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_ROLE_MANAGEMENT}
              fallbackPath="/admin-roles"
              showAccessDenied={true}
            >
              <AdminRolePage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-permissions" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_ROLE_MANAGEMENT}
              fallbackPath="/admin-permissions"
              showAccessDenied={true}
            >
              <AdminPermissionPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-employees" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_ROLE_MANAGEMENT}
              fallbackPath="/admin-employees"
              showAccessDenied={true}
            >
              <AdminEmployeePage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-devices" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_ROLE_MANAGEMENT}
              fallbackPath="/admin-devices"
              showAccessDenied={true}
            >
              <AdminManageDevicePage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-migration-income-documents" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_MIGRATION_INCOME}
              fallbackPath="/admin-devices"
              showAccessDenied={true}
            >
              <AdminSyncIncomeDocumentPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-registration-report" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_REPORTS}
              fallbackPath="/admin-registration-report"
              showAccessDenied={true}
            >
              <AdminRegistrationReport />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        <Route path="/admin-customer-confirmation" element={
          <ProtectedRoute>
            <RoleBasedRoute
              requiredPermission={Permission.VIEW_VERIFICATION_DOCUMENT}
              fallbackPath="/admin-customer-confirmation"
              showAccessDenied={true}
            >
              <AdminCustomerConfirmationPage />
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