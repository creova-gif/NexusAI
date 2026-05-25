import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import AuditTrail from '../../app/pages/AuditTrail';

function renderPage() {
  const { hook } = memoryLocation({ path: '/audit', static: true });
  return render(<Router hook={hook}><AuditTrail /></Router>);
}

describe('AuditTrail', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows Audit Trail heading', () => {
    renderPage();
    expect(screen.getAllByText(/Audit/i).length).toBeGreaterThan(0);
  });

  it('shows category filter buttons', () => {
    renderPage();
    expect(screen.getByText('ALL')).toBeInTheDocument();
  });

  it('shows immutable log label', () => {
    renderPage();
    expect(screen.getByText(/Immutable/i)).toBeInTheDocument();
  });

  it('shows audit log entries', () => {
    renderPage();
    expect(screen.getAllByText(/SAR|KYC|Alert|Login/i).length).toBeGreaterThan(0);
  });

  it('shows event actor names', () => {
    renderPage();
    expect(screen.getAllByText(/Marie Chen|James Park|System/i).length).toBeGreaterThan(0);
  });
});
