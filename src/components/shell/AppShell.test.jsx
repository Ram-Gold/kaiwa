/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AppShell from './AppShell.jsx';

describe('AppShell', () => {
  it('collapses the left sidebar and removes the right progress rail on briefing pages', () => {
    mockPathname = '/briefing/train-station';

    render(
      <AppShell>
        <main>Briefing content</main>
      </AppShell>,
    );

    expect(screen.queryByLabelText(/daily progress rail/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/daily progress menu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
    expect(screen.getByText(/Briefing content/i)).toBeInTheDocument();
  });
});
