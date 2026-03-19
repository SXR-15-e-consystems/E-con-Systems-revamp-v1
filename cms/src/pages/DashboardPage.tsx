import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { createPage, fetchPages } from '../api/endpoints';
import { PUBLIC_SITE_URL } from '../api/client';

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
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          Create New Page
        </button>
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
        <div className="fixed inset-0 grid place-items-center bg-black/40 p-4">
          <form className="w-full max-w-md space-y-4 rounded-lg bg-white p-6" onSubmit={handleCreate}>
            <h2 className="text-lg font-semibold">Create New Page</h2>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Slug</span>
              <input
                className="rounded border px-3 py-2"
                required
                value={slug}
                onChange={(event) => setSlug(event.target.value.trim().toLowerCase())}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Title</span>
              <input
                className="rounded border px-3 py-2"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Meta Description</span>
              <textarea
                className="rounded border px-3 py-2"
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
              />
            </label>
            {createMutation.isError ? (
              <p className="text-sm text-red-600">Failed to create page. Check slug uniqueness.</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                className="rounded border px-4 py-2"
                onClick={() => setShowCreate(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
                disabled={createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
