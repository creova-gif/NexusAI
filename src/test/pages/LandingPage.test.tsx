import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import LandingPage from '../../app/pages/LandingPage';

function renderPage() {
  const { hook } = memoryLocation({ path: '/', static: true });
  return render(<Router hook={hook}><LandingPage /></Router>);
}

describe('LandingPage', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('displays the NexusAI brand name', () => {
    renderPage();
    expect(screen.getAllByText(/Nexus/i).length).toBeGreaterThan(0);
  });

  it('shows the Product Tour nav link', () => {
    renderPage();
    const tourLink = screen.getByText('Product Tour');
    expect(tourLink).toBeInTheDocument();
    expect(tourLink.closest('a')).toHaveAttribute('href', '/tour');
  });

  it('shows the main hero headline', () => {
    renderPage();
    expect(screen.getByText(/The AI Platform/i)).toBeInTheDocument();
  });

  it('shows all six nav items', () => {
    renderPage();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Open Banking')).toBeInTheDocument();
    expect(screen.getByText('Advisory')).toBeInTheDocument();
    expect(screen.getByText('Government')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('shows FINTRAC compliance badge', () => {
    renderPage();
    expect(screen.getAllByText(/FINTRAC/i).length).toBeGreaterThan(0);
  });

  it('shows Request Demo CTA', () => {
    renderPage();
    expect(screen.getByText(/Request Demo/i)).toBeInTheDocument();
  });

  it('shows Canadian institution logos in the trust bar', () => {
    renderPage();
    expect(screen.getAllByText(/Royal Bank of Canada/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Scotiabank/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FINTRAC/i).length).toBeGreaterThan(0);
  });

  it('shows the CDBA announcement banner', () => {
    renderPage();
    expect(screen.getAllByText(/CDBA Phase 1/i).length).toBeGreaterThan(0);
  });
});
