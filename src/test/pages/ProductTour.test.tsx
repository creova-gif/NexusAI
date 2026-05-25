import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import ProductTour from '../../app/pages/ProductTour';

function renderPage() {
  const { hook } = memoryLocation({ path: '/tour', static: true });
  return render(<Router hook={hook}><ProductTour /></Router>);
}

describe('ProductTour', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows the main headline', () => {
    renderPage();
    expect(screen.getByText(/Compliance OS/i)).toBeInTheDocument();
  });

  it('shows the INTERACTIVE PRODUCT TOUR badge', () => {
    renderPage();
    expect(screen.getByText(/INTERACTIVE PRODUCT TOUR/i)).toBeInTheDocument();
  });

  it('shows scroll to explore prompt', () => {
    renderPage();
    expect(screen.getByText(/SCROLL TO EXPLORE/i)).toBeInTheDocument();
  });

  it('shows AML section heading', () => {
    renderPage();
    expect(screen.getAllByText(/AML Intelligence/i).length).toBeGreaterThan(0);
  });

  it('shows Rules Engine section', () => {
    renderPage();
    expect(screen.getAllByText(/Rules Engine/i).length).toBeGreaterThan(0);
  });

  it('shows Entity Network section', () => {
    renderPage();
    expect(screen.getAllByText(/Entity Network/i).length).toBeGreaterThan(0);
  });

  it('shows FINTRAC Reporting section', () => {
    renderPage();
    expect(screen.getAllByText(/FINTRAC Reporting/i).length).toBeGreaterThan(0);
  });

  it('shows Federated AI section', () => {
    renderPage();
    expect(screen.getAllByText(/Federated/i).length).toBeGreaterThan(0);
  });

  it('shows Open Dashboard nav link', () => {
    renderPage();
    expect(screen.getByText(/Open Dashboard/i)).toBeInTheDocument();
  });

  it('has a nav with NexusAI brand', () => {
    renderPage();
    expect(screen.getAllByText(/Nexus/i).length).toBeGreaterThan(0);
  });
});
