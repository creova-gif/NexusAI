import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import AgentInvestigator from '../../app/pages/AgentInvestigator';

function renderPage() {
  const { hook } = memoryLocation({ path: '/agent', static: true });
  return render(<Router hook={hook}><AgentInvestigator /></Router>);
}

describe('AgentInvestigator', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows Agentic Investigator heading', () => {
    renderPage();
    expect(screen.getAllByText(/Agentic/i).length).toBeGreaterThan(0);
  });

  it('shows AI badge in sidebar', () => {
    renderPage();
    expect(screen.getAllByText('AI').length).toBeGreaterThan(0);
  });

  it('shows investigation steps', () => {
    renderPage();
    expect(screen.getByText(/KYC Data Retrieval/i)).toBeInTheDocument();
  });

  it('shows Launch AI Agent button', () => {
    renderPage();
    expect(screen.getByText(/Launch AI Agent/i)).toBeInTheDocument();
  });
});
