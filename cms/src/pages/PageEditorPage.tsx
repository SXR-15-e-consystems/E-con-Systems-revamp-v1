import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { fetchPage, updatePage } from '../api/endpoints';
import { getBlockEditor } from '../components/blocks/BlockEditorRegistry';
import { sanitizeHtml } from '../utils/sanitize';
import type { BlockEnvelope, BlockType, PageStatus } from '../types';

const SUPPORTED_BLOCKS: BlockType[] = ['Hero', 'RichText'];

export function PageEditorPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => fetchPage(slug),
    enabled: slug.length > 0,
  });

  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [blocks, setBlocks] = useState<BlockEnvelope[]>([]);

  const initialized = useMemo(() => page !== undefined, [page]);

  if (initialized && title === '' && page) {
    setTitle(page.title);
    setMetaDescription(page.meta_description);
    setStatus(page.status);
    setBlocks(page.blocks);
  }

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PageStatus) => {
      const normalizedBlocks = blocks.map((block, index) => ({
        ...block,
        order: index,
        data:
          block.type === 'RichText' && typeof block.data.html === 'string'
            ? { ...block.data, html: sanitizeHtml(block.data.html) }
            : block.data,
      }));
      return updatePage(slug, {
        title,
        meta_description: metaDescription,
        status: nextStatus,
        blocks: normalizedBlocks,
      });
    },
    onSuccess: async (updatedPage) => {
      setStatus(updatedPage.status);
      setBlocks(updatedPage.blocks);
      await queryClient.invalidateQueries({ queryKey: ['pages'] });
      await queryClient.invalidateQueries({ queryKey: ['page', slug] });
    },
  });

  const addBlock = (type: BlockType) => {
    const baseData =
      type === 'Hero'
        ? { title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '' }
        : { html: '' };
    setBlocks((prev) => [
      ...prev,
      {
        block_id: uuidv4(),
        type,
        order: prev.length,
        visible: true,
        data: baseData,
      },
    ]);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next.map((block, idx) => ({ ...block, order: idx }));
    });
  };

  if (isLoading) {
    return <main className="mx-auto max-w-5xl p-6">Loading page...</main>;
  }

  if (isError || !page) {
    return <main className="mx-auto max-w-5xl p-6 text-red-600">Failed to load page.</main>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded border px-3 py-2" onClick={() => navigate('/')} type="button">
          Back
        </button>
        <h1 className="text-2xl font-bold">Editing: {page.slug}</h1>
        <div className="ml-auto flex gap-2">
          <button
            className="rounded border px-4 py-2"
            onClick={() => saveMutation.mutate(status)}
            type="button"
          >
            Save
          </button>
          <button
            className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
            onClick={() => saveMutation.mutate('published')}
            type="button"
          >
            Publish
          </button>
        </div>
      </div>

      {saveMutation.isError ? <p className="text-sm text-red-600">Failed to save page.</p> : null}
      {saveMutation.isSuccess ? <p className="text-sm text-emerald-700">Saved successfully.</p> : null}

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Metadata</h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Title</span>
          <input
            className="rounded border px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Meta Description</span>
          <textarea
            className="rounded border px-3 py-2"
            value={metaDescription}
            onChange={(event) => setMetaDescription(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Status</span>
          <select
            className="rounded border px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as PageStatus)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Blocks</h2>
          <div className="flex gap-2">
            {SUPPORTED_BLOCKS.map((blockType) => (
              <button
                key={blockType}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => addBlock(blockType)}
                type="button"
              >
                Add {blockType}
              </button>
            ))}
          </div>
        </div>

        {blocks.map((block, index) => {
          const Editor = getBlockEditor(block.type);
          return (
            <article key={block.block_id} className="space-y-3 rounded border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">
                  {index + 1}. {block.type}
                </h3>
                <button className="rounded border px-2 py-1" onClick={() => moveBlock(index, -1)} type="button">
                  Up
                </button>
                <button className="rounded border px-2 py-1" onClick={() => moveBlock(index, 1)} type="button">
                  Down
                </button>
                <button
                  className="rounded border px-2 py-1"
                  onClick={() =>
                    setBlocks((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, visible: !item.visible } : item,
                      ),
                    )
                  }
                  type="button"
                >
                  {block.visible ? 'Hide' : 'Show'}
                </button>
                <button
                  className="rounded border border-red-400 px-2 py-1 text-red-700"
                  onClick={() =>
                    setBlocks((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx })))
                  }
                  type="button"
                >
                  Delete
                </button>
              </div>

              {Editor ? (
                <Editor
                  block={block}
                  onChange={(updatedData) =>
                    setBlocks((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, data: updatedData } : item,
                      ),
                    )
                  }
                />
              ) : (
                <p className="text-sm text-slate-500">Editor not implemented for this block type yet.</p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
