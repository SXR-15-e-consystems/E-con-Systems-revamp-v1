import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { createPage, fetchPages } from '../api/endpoints';
import { PUBLIC_SITE_URL, apiClient } from '../api/client';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pages'],
    queryFn: fetchPages,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: createPage,
    onSuccess: async () => {
      setShowCreate(false);
      setSlug('');
      setTitle('');
      setMetaDescription('');
      await queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      slug,
      title,
      meta_description: metaDescription,
    });
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Pages</h1>
        <div className="flex gap-2">
          <Link
            to="/templates"
            className="rounded border border-blue-600 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
          >
            🎨 Templates
          </Link>
          <button
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            Create New Page
          </button>
        </div>
      </div>

      {isLoading ? <p>Loading pages...</p> : null}
      {isError ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Failed to load pages.
          <button className="ml-3 underline" onClick={() => refetch()} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && data?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No pages yet. Create your first page.
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Preview
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-blue-700 hover:underline" to={`/pages/${page.slug}/edit`}>
                      {page.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">/{page.slug}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(page.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      href={`${PUBLIC_SITE_URL}/${page.slug}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showCreate ? (
        <CreatePageFlow onClose={() => setShowCreate(false)} onCreateSuccess={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ['pages'] });
        }} />
      ) : null}
    </main>
  );
}

function CreatePageFlow({ onClose, onCreateSuccess }: { onClose: () => void, onCreateSuccess: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await apiClient.get<import('../types/template').TemplateListItem[]>('/cms/templates');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: createPage,
    onSuccess: onCreateSuccess,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      slug,
      title,
      meta_description: metaDescription,
      template_id: selectedTemplateId || undefined,
    } as any);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Create New Page</h2>
            <p className="mt-1 text-sm text-slate-500">
              {step === 1 ? 'Step 1: Choose a layout template' : 'Step 2: Page details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-12 text-center text-slate-500">Loading templates...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Blank Template Option */}
                  <div
                    onClick={() => {
                      setSelectedTemplateId(null);
                      setStep(2);
                    }}
                    className="group cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-white p-5 transition-all hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="flex h-32 items-center justify-center rounded bg-slate-50">
                      <span className="text-4xl opacity-40">📄</span>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Blank Page</h3>
                      <p className="mt-1 text-xs text-slate-500">Start from scratch with legacy block builder</p>
                    </div>
                  </div>

                  {/* Available Templates */}
                  {templates?.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setStep(2);
                      }}
                      className="group cursor-pointer rounded-lg border-2 border-slate-200 bg-white p-5 transition-all hover:border-blue-500 hover:shadow-md"
                    >
                      <div className="mb-3 flex h-32 items-center justify-center rounded bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100">
                         <span className="text-4xl opacity-50">🎨</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{tmpl.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[32px]">{tmpl.description}</p>
                      <div className="mt-3 flex gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] uppercase font-semibold text-slate-500">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{tmpl.component_count} blocks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form id="create-page-form" className="mx-auto max-w-lg space-y-5 py-4" onSubmit={handleCreate}>
              {selectedTemplateId && (
                <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-3">
                  <span className="text-xl">🎨</span>
                  <div>
                    <span className="font-semibold block">Using Template</span>
                    <span className="text-blue-600 text-xs">{templates?.find(t => t.id === selectedTemplateId)?.name}</span>
                  </div>
                </div>
              )}
              
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-slate-700">Page Title <span className="text-red-500">*</span></span>
                <input
                  className="rounded-md border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. New Product Launch"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-slate-700">URL Slug <span className="text-red-500">*</span></span>
                <div className="flex rounded-md border border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="flex items-center border-r border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">/</span>
                  <input
                    className="w-full rounded-r-md px-3 py-2.5 focus:outline-none"
                    required
                    value={slug}
                    onChange={(event) => setSlug(event.target.value.trim().toLowerCase().replace(/[^a-z0-9-/]/g, ''))}
                    placeholder="new-product"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-slate-700">Meta Description</span>
                <textarea
                  className="rounded-md border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  placeholder="Search engine snippet..."
                />
              </label>
              
              {createMutation.isError ? (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  Failed to create page. Check if the slug is already in use.
                </div>
              ) : null}
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              type="button"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← Back to templates
            </button>
          ) : (
            <div></div> // Placeholder for flex spacing
          )}
          
          <div className="flex gap-3">
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            {step === 2 && (
              <button
                form="create-page-form"
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                disabled={createMutation.isPending || !title || !slug}
                type="submit"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Page'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
