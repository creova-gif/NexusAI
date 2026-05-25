import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import AMLAlerts from '../../app/pages/AMLAlerts';

function renderPage() {
  const { hook } = memoryLocation({ path: '/alerts', static: true });
  return render(<Router hook={hook}><AMLAlerts /></Router>);
}

describe('AMLAlerts', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows AML Alerts heading', () => {
    renderPage();
    expect(screen.getAllByText(/AML Alerts/i).length).toBeGreaterThan(0);
  });

  it('shows risk level filter buttons', () => {
    renderPage();
    expect(screen.getByText('ALL')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('shows More Filters button', () => {
    renderPage();
    expect(screen.getByText(/More Filters/i)).toBeInTheDocument();
  });

  it('shows alert severity labels', () => {
    renderPage();
    expect(screen.getAllByText(/CRITICAL|HIGH|MEDIUM|LOW/i).length).toBeGreaterThan(0);
  });

  it('shows search input', () => {
    renderPage();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('shows Live Alert Queue label', () => {
    renderPage();
    expect(screen.getByText(/Live Alert Queue/i)).toBeInTheDocument();
  });
});
