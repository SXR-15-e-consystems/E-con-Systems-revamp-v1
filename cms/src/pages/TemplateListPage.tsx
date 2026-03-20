import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { fetchTemplates, deleteTemplate } from '../api/templateEndpoints';

export function TemplateListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => navigate('/')}
            type="button"
          >
            ← Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
        </div>
        <Link
          to="/templates/new"
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          + Create Template
        </Link>
      </div>

      {isLoading && <p className="text-slate-500">Loading templates...</p>}
      {isError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Failed to load templates.{' '}
          <button className="ml-3 underline" onClick={() => refetch()} type="button">
            Retry
          </button>
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl mb-3">🎨</p>
          <p className="text-lg font-semibold text-slate-500">No templates yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first template to start building no-code pages
          </p>
          <Link
            to="/templates/new"
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Template
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((tmpl) => (
            <div
              key={tmpl.id}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Preview placeholder */}
              <div className="mb-3 h-32 rounded bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center">
                <span className="text-3xl opacity-50">🎨</span>
              </div>

              <h3 className="text-sm font-bold text-slate-800">{tmpl.name}</h3>
              {tmpl.description && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{tmpl.description}</p>
              )}

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                  {tmpl.category}
                </span>
                <span className="text-[10px] text-slate-400">
                  {tmpl.component_count} component{tmpl.component_count !== 1 ? 's' : ''}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    tmpl.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tmpl.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  to={`/templates/${tmpl.id}/edit`}
                  className="flex-1 rounded border border-blue-500 px-3 py-1.5 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm('Delete this template? This cannot be undone.')) {
                      deleteMutation.mutate(tmpl.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>

              <p className="mt-2 text-[10px] text-slate-400">
                Updated: {new Date(tmpl.updated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
