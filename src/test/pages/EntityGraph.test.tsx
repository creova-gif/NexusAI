import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import EntityGraph from '../../app/pages/EntityGraph';

function renderPage() {
  const { hook } = memoryLocation({ path: '/network', static: true });
  return render(<Router hook={hook}><EntityGraph /></Router>);
}

describe('EntityGraph', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows the Entity Network heading', () => {
    renderPage();
    expect(screen.getAllByText(/Entity Network/i).length).toBeGreaterThan(0);
  });

  it('shows risk level filter buttons', () => {
    renderPage();
    expect(screen.getAllByText('ALL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CRITICAL').length).toBeGreaterThan(0);
  });

  it('renders the SVG graph', () => {
    const { container } = renderPage();
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('shows Export Map button', () => {
    renderPage();
    expect(screen.getByText(/Export Map/i)).toBeInTheDocument();
  });

  it('shows critical/high risk legend entries', () => {
    renderPage();
    expect(screen.getByText(/Critical \/ OFAC Match/i)).toBeInTheDocument();
    expect(screen.getByText(/High Risk \/ Suspicious/i)).toBeInTheDocument();
  });

  it('shows node detail panel label', () => {
    renderPage();
    expect(screen.getAllByText(/Risk Score|RISK|Entity/i).length).toBeGreaterThan(0);
  });
});
