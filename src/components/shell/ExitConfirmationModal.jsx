'use client';

import React from 'react';
import { IoWarningSharp, IoCloseSharp } from 'react-icons/io5';
import Button from '../ui/Button.jsx';

export default function ExitConfirmationModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-confirmation-title"
      aria-describedby="exit-confirmation-description"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] cursor-pointer"
        aria-hidden="true"
        onClick={onCancel}
      />
      <div className="animate-panel-in relative z-10 w-full max-w-md brutal-border bg-paper p-6 text-ink shadow-shadow">
        <button
          type="button"
          aria-label="Close modal and stay in exercise"
          onClick={onCancel}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center brutal-border bg-white text-ink shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <IoCloseSharp size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="brutal-border grid h-10 w-10 shrink-0 place-items-center bg-shu text-paper shadow-nav">
            <IoWarningSharp size={20} />
          </div>
          <div>
            <p className="label-mono text-shu">Exercise in progress</p>
            <h2 id="exit-confirmation-title" className="font-display text-3xl leading-tight">
              Exit Exercise?
            </h2>
          </div>
        </div>

        <p id="exit-confirmation-description" className="mt-4 text-sm font-bold leading-relaxed text-ink/80">
          You are currently in the middle of a roleplay or lesson exercise. Leaving now will cancel your session and it will not be saved in your past practice history.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Keep Practicing
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-shu text-paper hover:bg-shu/90"
          >
            Leave & Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
