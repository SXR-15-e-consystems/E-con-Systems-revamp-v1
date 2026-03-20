import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { fetchPage, updatePage } from '../api/endpoints';
import { getBlockEditor } from '../components/blocks/BlockEditorRegistry';
import { sanitizeHtml } from '../utils/sanitize';
import type { BlockEnvelope, BlockType, PageStatus, Page } from '../types';
import { apiClient } from '../api/client';
import type { Template } from '../types/template';
import { PlaceholderOverlay } from '../components/placeholders/PlaceholderOverlay';
import { ContentInjectionModal } from '../components/placeholders/ContentInjectionModal';

const SUPPORTED_BLOCKS: BlockType[] = ['Hero', 'RichText'];

export function PageEditorPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading: pageLoading, isError: pageError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => fetchPage(slug),
    enabled: slug.length > 0,
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', page?.template_id],
    queryFn: async () => {
      const { data } = await apiClient.get<Template>(`/cms/templates/${page?.template_id}`);
      return data;
    },
    enabled: !!page?.template_id,
  });

  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [blocks, setBlocks] = useState<BlockEnvelope[]>([]);
  
  // Modal state for template blocks
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

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

  if (pageLoading || (page?.template_id && templateLoading)) {
    return <main className="mx-auto max-w-5xl p-6">Loading page...</main>;
  }

  if (pageError || !page) {
    return <main className="mx-auto max-w-5xl p-6 text-red-600">Failed to load page.</main>;
  }

  const isTemplatePage = !!page.template_id;
  const editingBlock = editingBlockId ? blocks.find(b => b.block_id === editingBlockId) : null;
  const editingComponentDef = editingBlock && template ? template.components.find(c => c.component_id === editingBlock.component_id) : null;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={() => navigate('/')} type="button">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editing: {page.slug}</h1>
        {isTemplatePage && template && (
           <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
             Template: {template.name}
           </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => saveMutation.mutate(status)}
            type="button"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
            onClick={() => saveMutation.mutate('published')}
            type="button"
            disabled={saveMutation.isPending}
          >
            Publish Page
          </button>
        </div>
      </div>

      {saveMutation.isError ? <p className="text-sm rounded bg-red-50 text-red-600 px-4 py-2">Failed to save page.</p> : null}
      {saveMutation.isSuccess ? <p className="text-sm rounded bg-emerald-50 text-emerald-700 px-4 py-2">Saved successfully.</p> : null}

      {/* Metadata Section */}
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Page Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Title <span className="text-red-500">*</span></span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Meta Description</span>
            <textarea
              className="rounded-md border border-slate-300 px-3 py-2 min-h-[80px] focus:border-blue-500 focus:outline-none"
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Status</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none bg-slate-50"
              value={status}
              disabled
              onChange={(event) => setStatus(event.target.value as PageStatus)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </section>

      {/* Editor Content Section */}
      <section className="space-y-4">
        {isTemplatePage && template ? (
          // TEMPLATE GRID RENDERER
          <div>
             <h2 className="text-lg font-semibold text-slate-800 mb-4">Content Blocks</h2>
             <div className="bg-slate-100 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-inner">
                <div 
                  className="mx-auto max-w-[1440px]"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${template.grid.columns}, 1fr)`,
                    gap: `${template.grid.gap}px`
                  }}
                >
                  {blocks.map((block) => {
                    // Find corresponding template layout details
                    const compDef = template.components.find(c => c.component_id === block.component_id);
                    if (!compDef) return null;

                    return (
                      <div 
                        key={block.block_id}
                        style={{
                           gridColumn: `${compDef.grid_placement.col_start} / ${compDef.grid_placement.col_end}`
                        }}
                      >
                         <PlaceholderOverlay
                           type={block.type as BlockType}
                           label={compDef.label}
                           isFilled={block.content_status === 'filled'}
                           onEdit={() => setEditingBlockId(block.block_id)}
                         />
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        ) : (
          // LEGACY BLOCK BUILDER RENDERER
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-semibold text-slate-800">Legacy Blocks</h2>
              <div className="flex gap-2">
                {SUPPORTED_BLOCKS.map((blockType) => (
                  <button
                    key={blockType}
                    className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    onClick={() => addBlock(blockType)}
                    type="button"
                  >
                    + {blockType}
                  </button>
                ))}
              </div>
            </div>

            {blocks.map((block, index) => {
              const Editor = getBlockEditor(block.type);
              return (
                <article key={block.block_id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-700">
                      {index + 1}. {block.type}
                    </h3>
                    <button className="rounded bg-white border px-2 py-1 text-xs font-medium" onClick={() => moveBlock(index, -1)} type="button">Up</button>
                    <button className="rounded bg-white border px-2 py-1 text-xs font-medium" onClick={() => moveBlock(index, 1)} type="button">Down</button>
                    <button
                      className="rounded bg-white border px-2 py-1 text-xs font-medium"
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
                      className="rounded bg-white border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 ml-auto"
                      onClick={() =>
                        setBlocks((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx })))
                      }
                      type="button"
                    >
                      Delete
                    </button>
                  </div>

                  {Editor ? (
                    <div className="bg-white p-4 border border-slate-200 rounded-md">
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
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Editor not implemented for this block type yet.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Editor Modal */}
      {editingBlock && (
        <ContentInjectionModal
          block={editingBlock}
          label={editingComponentDef?.label}
          onClose={() => setEditingBlockId(null)}
          onSave={(updatedBlock) => {
             setBlocks(prev => prev.map(b => b.block_id === updatedBlock.block_id ? updatedBlock : b));
             setEditingBlockId(null);
          }}
        />
      )}
    </main>
  );
}
