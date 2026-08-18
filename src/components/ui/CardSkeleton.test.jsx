/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
vi.stubGlobal('React', React);

afterEach(() => {
  cleanup();
});

import CardSkeleton from './CardSkeleton.jsx';

describe('CardSkeleton', () => {
  it('renders loading skeleton elements matching the card structure', () => {
    const { container } = render(<CardSkeleton count={2} />);
    const cardSkeletons = container.querySelectorAll('.nb-card-clean');
    expect(cardSkeletons).toHaveLength(2);
    
    const skeletonElements = container.querySelectorAll('.react-loading-skeleton');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
