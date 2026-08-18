/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import NeubrutalCard from './NeubrutalCard.jsx';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

describe('NeubrutalCard Component', () => {
  it('renders top symmetrical badges with category on top-left and JLPT level on top-right', () => {
    render(
      <NeubrutalCard
        category="BEGINNER"
        level="N5"
        title="Basic Verbs"
        japaneseText="行きます"
        romajiOrMeaning="To go / Ikimasu"
        progress={80}
        showHint={true}
      />
    );

    expect(screen.getByText('BEGINNER')).toBeInTheDocument();
    expect(screen.getByText('N5')).toBeInTheDocument();
    expect(screen.getByText('Basic Verbs')).toBeInTheDocument();
    expect(screen.getByText(/行きます/)).toBeInTheDocument();
    expect(screen.getByText(/\(To go \/ Ikimasu\)/)).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText(/Hover or tap card to test hover mechanics/i)).toBeInTheDocument();
  });

  it('renders correctly with custom href and custom footer', () => {
    render(
      <NeubrutalCard
        href="/briefing/basic-verbs"
        title="Basic Verbs"
        footerContent={<div data-testid="custom-footer">Custom Action</div>}
      />
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/briefing/basic-verbs');
    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
  });
});
