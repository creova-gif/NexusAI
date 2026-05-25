import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import userEvent from '@testing-library/user-event';
import RulesEngine from '../../app/pages/RulesEngine';

function renderPage() {
  const { hook } = memoryLocation({ path: '/rules', static: true });
  return render(<Router hook={hook}><RulesEngine /></Router>);
}

describe('RulesEngine', () => {
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it('shows the Rules Engine heading', () => {
    renderPage();
    expect(screen.getAllByText(/Rules Engine/i).length).toBeGreaterThan(0);
  });

  it('shows the total rules stat', () => {
    renderPage();
    expect(screen.getByText(/Total Rules/i)).toBeInTheDocument();
  });

  it('shows active rules stat', () => {
    renderPage();
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
  });

  it('shows category filter buttons', () => {
    renderPage();
    expect(screen.getAllByText(/All/i).length).toBeGreaterThan(0);
  });

  it('shows the search input', () => {
    renderPage();
    const searchInputs = screen.getAllByRole('textbox');
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it('renders at least one rule row', () => {
    renderPage();
    expect(screen.getAllByText(/Structuring/i).length).toBeGreaterThan(0);
  });

  it('shows weekly trigger volume chart label', () => {
    renderPage();
    expect(screen.getByText(/Weekly Trigger Volume/i)).toBeInTheDocument();
  });

  it('shows recent trigger log', () => {
    renderPage();
    expect(screen.getByText(/Recent Trigger Log/i)).toBeInTheDocument();
  });

  it('filter click does not crash', async () => {
    renderPage();
    const allBtns = screen.getAllByText(/All/i);
    await userEvent.click(allBtns[0]);
    expect(allBtns[0]).toBeInTheDocument();
  });
});
