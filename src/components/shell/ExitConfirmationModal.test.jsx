/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

import ExitConfirmationModal from './ExitConfirmationModal.jsx';

describe('ExitConfirmationModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ExitConfirmationModal isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with warning message when isOpen is true', () => {
    render(<ExitConfirmationModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /exit exercise\?/i })).toBeInTheDocument();
    expect(screen.getByText(/leaving now will cancel your session/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep practicing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave & cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when clicking Keep Practicing', async () => {
    const onCancel = vi.fn();
    render(<ExitConfirmationModal isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /keep practicing/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when clicking Leave & Cancel', async () => {
    const onConfirm = vi.fn();
    render(<ExitConfirmationModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /leave & cancel/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
