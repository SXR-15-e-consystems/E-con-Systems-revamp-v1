import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { PageEditorPage } from './pages/PageEditorPage';
import { TemplateListPage } from './pages/TemplateListPage';
import { TemplateBuilderPage } from './pages/TemplateBuilderPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/pages/:slug/edit" element={<PageEditorPage />} />
      <Route path="/templates" element={<TemplateListPage />} />
      <Route path="/templates/new" element={<TemplateBuilderPage />} />
      <Route path="/templates/:templateId/edit" element={<TemplateBuilderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

