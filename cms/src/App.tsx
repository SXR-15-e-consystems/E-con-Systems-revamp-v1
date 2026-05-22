import { Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { CMSLayout } from './components/CMSLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PageEditorPage } from './pages/PageEditorPage';
import { TemplateListPage } from './pages/TemplateListPage';
import { TemplateBuilderPage } from './pages/TemplateBuilderPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { NavigationPage } from './pages/NavigationPage';
import { UIStringsPage } from './pages/UIStringsPage';
import { TaxonomyPage } from './pages/TaxonomyPage';
import { WebstoreConfigPage } from './pages/WebstoreConfigPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* All CMS routes share the layout (header + nav + logout) */}
      <Route element={<ProtectedRoute><CMSLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pages/:slug/edit" element={<ProtectedRoute allowedRoles={['admin', 'marketing']}><PageEditorPage /></ProtectedRoute>} />
        <Route path="/templates" element={<TemplateListPage />} />
        <Route path="/templates/new" element={<ProtectedRoute allowedRoles={['admin']}><TemplateBuilderPage /></ProtectedRoute>} />
        <Route path="/templates/:templateId/edit" element={<ProtectedRoute allowedRoles={['admin']}><TemplateBuilderPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/navigation" element={<ProtectedRoute allowedRoles={['admin', 'marketing']}><NavigationPage /></ProtectedRoute>} />
        <Route path="/ui-strings" element={<ProtectedRoute allowedRoles={['admin', 'marketing']}><UIStringsPage /></ProtectedRoute>} />
        <Route path="/taxonomy" element={<ProtectedRoute allowedRoles={['admin', 'marketing']}><TaxonomyPage /></ProtectedRoute>} />
        <Route path="/webstore-config" element={<ProtectedRoute allowedRoles={['admin', 'marketing']}><WebstoreConfigPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

