import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import DashboardLayout from '../app/components/DashboardLayout';

function renderLayout(path = '/dashboard') {
  const { hook } = memoryLocation({ path, static: true });
  return render(
    <Router hook={hook}>
      <DashboardLayout>
        <div data-testid="slot">content</div>
      </DashboardLayout>
    </Router>
  );
}

describe('DashboardLayout sidebar', () => {
  it('renders without crashing', () => {
    const { container } = renderLayout();
    expect(container.firstChild).not.toBeNull();
  });

  it('renders children', () => {
    renderLayout();
    expect(screen.getByTestId('slot')).toBeInTheDocument();
  });

  it('shows CORE section', () => {
    renderLayout();
    expect(screen.getByText('CORE')).toBeInTheDocument();
  });

  it('shows MODULES section', () => {
    renderLayout();
    expect(screen.getByText('MODULES')).toBeInTheDocument();
  });

  it('shows ENTERPRISE section', () => {
    renderLayout();
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
  });

  it('shows NEXT GEN section', () => {
    renderLayout();
    expect(screen.getByText('NEXT GEN')).toBeInTheDocument();
  });

  it('shows OPERATIONS section', () => {
    renderLayout();
    expect(screen.getByText('OPERATIONS')).toBeInTheDocument();
  });

  it('Product Tour appears under NEXT GEN with TOUR badge', () => {
    renderLayout();
    expect(screen.getByText('Product Tour')).toBeInTheDocument();
    expect(screen.getByText('TOUR')).toBeInTheDocument();
  });

  it('Agentic Investigator appears with AI badge', () => {
    renderLayout();
    expect(screen.getByText('Agentic Investigator')).toBeInTheDocument();
    expect(screen.getAllByText('AI').length).toBeGreaterThan(0);
  });

  it('Overview nav link is present', () => {
    renderLayout('/dashboard');
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
  });

  it('shows the NexusAI logo text', () => {
    renderLayout();
    expect(screen.getAllByText(/Nexus/i).length).toBeGreaterThan(0);
  });
});
