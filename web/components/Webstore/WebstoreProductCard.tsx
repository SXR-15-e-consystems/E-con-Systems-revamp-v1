'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { WebstoreProductItem, OrderRowSummary, WebstoreDistributor } from '@/types';
import type { ProductPriceResult } from '@/types/templates';
import { CountryModal } from './CountryModal';

interface Props {
  product: WebstoreProductItem;
  priceMap: Record<string, ProductPriceResult>;
  purchaseMode: 'buy' | 'contact';
  distributor: WebstoreDistributor | null;
  country: string;
  highlightSku?: string | null;
}

export function WebstoreProductCard({ product, priceMap, purchaseMode, distributor, country, highlightSku = null }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isHighlighted = !!highlightSku && product.order_rows.some((r) => r.nop_product_id === highlightSku);
  const isBlurred = !!highlightSku && !isHighlighted;

  // Priority: CMS override -> hero_title from block -> product_name -> page title
  const displayTitle = product.webstore_title || product.hero_title || product.product_name || product.title;
  const skuBadge = product.sku_badge;
  const productUrl = product.url_path || `/${product.slug}`;

  const hasVolumePrice =
    product.volume_price &&
    product.volume_price.trim() !== '' &&
    product.volume_price.toLowerCase() !== 'contact us';

  const getRowPrice = (row: OrderRowSummary): string => {
    const live = priceMap[row.nop_product_id];
    if (live?.price !== undefined) return `$${live.price.toFixed(2)}`;
    return row.price || '-';
  };

  const getRowMode = (row: OrderRowSummary): 'buy' | 'contact' => {
    const live = priceMap[row.nop_product_id];
    if (live?.purchaseType === 'contact_us') return 'contact';
    return purchaseMode;
  };

  return (
    <>
      {showModal && (
        <CountryModal
          onClose={() => setShowModal(false)}
          distributor={distributor}
          country={country}
        />
      )}

      <div
        className={`w-full rounded-2xl border bg-white shadow-sm hover:shadow-md transition-[filter,opacity,box-shadow] duration-300 overflow-hidden ${
          isHighlighted
            ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 shadow-md'
            : isBlurred
            ? 'border-slate-200 blur-[1.5px] opacity-50 pointer-events-none'
            : 'border-slate-200'
        }`}
        {...(isHighlighted ? { 'data-highlight-target': 'true' } : {})}
      >

        {/* Header: small thumbnail + title / badges / spec pills */}
        <div className="flex gap-4 p-4 sm:p-5">

          {/* Small square thumbnail — clickable */}
          <a
            href={productUrl}
            className="relative shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 overflow-hidden block hover:opacity-90 transition-opacity"
            tabIndex={-1}
            aria-hidden="true"
          >
            {product.webstore_image_url && !imgError ? (
              <Image
                src={product.webstore_image_url}
                alt={displayTitle}
                fill
                className="object-contain p-2"
                onError={() => setImgError(true)}
                sizes="144px"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.83.83a.75.75 0 1 1-1.06 1.06l-5-5a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </a>

          {/* Right side: title, badges, spec pills */}
          <div className="flex flex-col min-w-0 flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {product.webstore_category && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  {product.webstore_category}
                </span>
              )}
              {skuBadge && (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-500">
                  {skuBadge}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-3">
              <a href={productUrl} className="hover:text-blue-700 transition-colors">
                {displayTitle}
              </a>
            </h3>

            {/* Spec pills: label · value */}
            {product.webstore_features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {product.webstore_features.map((feat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] leading-none"
                  >
                    <span className="font-semibold text-slate-500">{feat.label}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-800">{feat.value}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Know More CTA */}
            <div className="mt-auto pt-1">
              <a
                href={productUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
              >
                Know More
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Order rows */}
        {product.order_rows.length > 0 && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">

            {/* Desktop: table */}
            <div className="hidden sm:block rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide">Product Code</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide">Kit Contents</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide">Price</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.order_rows.map((row, idx) => {
                    const rowMode = getRowMode(row);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">{row.part_no}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {row.kit_contents.length > 0 ? (
                            <ul className="space-y-0.5">
                              {row.kit_contents.map((item, ki) => (
                                <li key={ki} className="flex items-start gap-1.5">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-900 whitespace-nowrap">{getRowPrice(row)}</td>
                        <td className="px-4 py-3 text-center">
                          {rowMode === 'buy' ? (
                            <a
                              href={row.cart_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors whitespace-nowrap shadow-sm"
                            >
                              Buy Now
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowModal(true)}
                              className="inline-block rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm"
                            >
                              Contact Sales
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked order cards */}
            <div className="sm:hidden space-y-2.5">
              {product.order_rows.map((row, idx) => {
                const rowMode = getRowMode(row);
                return (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-800">{row.part_no}</span>
                      <span className="text-sm font-bold text-slate-900">{getRowPrice(row)}</span>
                    </div>
                    {row.kit_contents.length > 0 && (
                      <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                        {row.kit_contents.map((item, ki) => (
                          <li key={ki} className="flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {rowMode === 'buy' ? (
                      <a
                        href={row.cart_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                      >
                        Buy Now
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        Contact Sales
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Volume price note */}
            {hasVolumePrice && (
              <p className="mt-2.5 text-[11px] text-slate-500 text-right">
                For volume pricing contact e-con Systems sales team{' '}
                <a href="mailto:sales@e-consystems.com" className="text-blue-600 hover:underline font-medium">
                  sales@e-consystems.com
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}