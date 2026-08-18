'use client';

import React from 'react';
import { IoAlertCircleSharp, IoCloseSharp } from 'react-icons/io5';

export default function ConfirmChangesModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Changes',
  message = 'Are you sure you want to save these changes?',
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-changes-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink/75 backdrop-blur-xs animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="brutal-border w-full max-w-sm bg-white p-5 text-ink shadow-shadow animate-panel-in rounded-xl border-2 border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b-2 border-border/10">
          <div className="flex items-center gap-2">
            <span className="brutal-border grid h-7 w-7 place-items-center rounded-md bg-mustard text-ink text-sm shadow-xs">
              <IoAlertCircleSharp className="text-base" />
            </span>
            <h3 id="confirm-changes-title" className="font-display text-lg font-black text-ink">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel confirmation"
            className="grid h-7 w-7 place-items-center rounded-lg border border-transparent hover:border-border hover:bg-paper text-ink transition-colors cursor-pointer"
          >
            <IoCloseSharp className="text-lg" />
          </button>
        </div>

        <div className="py-4">
          <p className="font-mono text-xs font-bold text-ink/80 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-3 border-t-2 border-border/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-2 border-border bg-paper text-ink px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold uppercase hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="border-2 border-border bg-mustard text-ink px-5 py-1.5 rounded-lg font-mono text-xs font-black uppercase shadow-xs hover:bg-mustard/80 transition-all cursor-pointer"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
