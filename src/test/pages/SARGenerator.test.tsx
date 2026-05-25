import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import SARGenerator from '../../app/pages/SARGenerator';

function renderPage() {
  const { hook } = memoryLocation({ path: '/sar', static: true });
  return render(<Router hook={hook}><SARGenerator /></Router>);
}

describe('SARGenerator', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows SAR heading', () => {
    renderPage();
    expect(screen.getAllByText(/SAR/i).length).toBeGreaterThan(0);
  });

  it('shows FINTRAC reference', () => {
    renderPage();
    expect(screen.getAllByText(/FINTRAC/i).length).toBeGreaterThan(0);
  });

  it('shows status indicators', () => {
    renderPage();
    expect(screen.getAllByText(/Draft|Pending|Filed|Submitted/i).length).toBeGreaterThan(0);
  });
});
