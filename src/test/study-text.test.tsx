import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightedParagraph } from '../components/StudyText';
import type { TextHighlight } from '../domain/types';

describe('study text rendering', () => {
  it('does not apply highlights when paragraph content has changed', () => {
    const stale: TextHighlight = { id: 'old', unitId: 'U01', passageId: 'p-1', quote: 'new text', passageText: 'old text', startOffset: 0, endOffset: 8, createdAt: '2026-10-27T00:00:00Z' };
    render(<HighlightedParagraph text="new text in a changed paragraph" passageId="p-1" highlights={[stale]} onHighlightClick={vi.fn()} />);
    expect(screen.getByText('new text in a changed paragraph')).toBeInTheDocument();
    expect(document.querySelector('mark.study-highlight')).toBeNull();
  });

  it('restores exact non-overlapping offsets while keeping strong fragments', () => {
    const text = 'Alpha key, beta key.';
    const highlight = (id: string, quote: string, startOffset: number): TextHighlight => ({ id, unitId: 'U01', passageId: 'p-1', quote, passageText: text, startOffset, endOffset: startOffset + quote.length, createdAt: '2026-10-27T00:00:00Z' });
    render(<HighlightedParagraph text={text} passageId="p-1" highlights={[highlight('a', 'Alpha', 0), highlight('b', 'beta', 11)]} emphasis={['key']} onHighlightClick={vi.fn()} />);
    const marks = [...document.querySelectorAll('mark.study-highlight')];
    expect(marks.map(mark => mark.textContent)).toEqual(['Alpha', 'beta']);
    expect(document.querySelectorAll('strong')).toHaveLength(2);
  });
});
