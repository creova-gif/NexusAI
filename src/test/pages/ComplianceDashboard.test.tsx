import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import ComplianceDashboard from '../../app/pages/ComplianceDashboard';

function renderPage() {
  const { hook } = memoryLocation({ path: '/dashboard', static: true });
  return render(<Router hook={hook}><ComplianceDashboard /></Router>);
}

describe('ComplianceDashboard', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows the Compliance Overview heading', () => {
    renderPage();
    expect(screen.getByText(/Compliance Overview/i)).toBeInTheDocument();
  });

  it('shows key stat labels', () => {
    renderPage();
    expect(screen.getByText(/Active High Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Alerts Today/i)).toBeInTheDocument();
    expect(screen.getByText(/SARs Filed/i)).toBeInTheDocument();
  });

  it('shows dashboard tab navigation', () => {
    renderPage();
    expect(screen.getAllByText(/OVERVIEW/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ALERTS/i).length).toBeGreaterThan(0);
  });

  it('shows platform risk section', () => {
    renderPage();
    expect(screen.getAllByText(/Platform Risk/i).length).toBeGreaterThan(0);
  });

  it('sidebar shows compliance officer role', () => {
    renderPage();
    expect(screen.getAllByText(/Compliance Officer/i).length).toBeGreaterThan(0);
  });

  it('sidebar contains core nav items', () => {
    renderPage();
    expect(screen.getAllByText(/AML Alerts/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Network Graph')).toBeInTheDocument();
    expect(screen.getByText('SAR Generator')).toBeInTheDocument();
  });

  it('sidebar NEXT GEN section includes Product Tour link', () => {
    renderPage();
    expect(screen.getByText('Product Tour')).toBeInTheDocument();
  });
});
