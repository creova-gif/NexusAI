import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import App from '../app/App';

function renderAt(path: string) {
  const { hook } = memoryLocation({ path, static: true });
  return render(
    <Router hook={hook}>
      <App />
    </Router>
  );
}

const routes: [string, string][] = [
  ['/', 'landing'],
  ['/tour', 'product tour'],
  ['/dashboard', 'compliance'],
  ['/compliance', 'compliance'],
  ['/alerts', 'alerts'],
  ['/network', 'entity'],
  ['/kyc', 'kyc'],
  ['/sanctions', 'sanctions'],
  ['/sar', 'sar'],
  ['/advisory', 'advisory'],
  ['/openbanking', 'open banking'],
  ['/audit', 'audit'],
  ['/admin', 'system'],
  ['/cases', 'case'],
  ['/supervisor', 'supervisor'],
  ['/rules', 'rules'],
  ['/risk-profile', 'risk'],
  ['/screening', 'watchlist'],
  ['/ubo', 'ubo'],
  ['/reporting', 'report'],
  ['/agent', 'agent'],
  ['/crypto-graph', 'crypto'],
  ['/federated', 'federated'],
  ['/deepfake', 'deepfake'],
  ['/comms', 'comm'],
  ['/workflow-builder', 'workflow'],
  ['/qa-checker', 'maker'],
];

describe('Route smoke tests — every route renders without crashing', () => {
  for (const [path, label] of routes) {
    it(`renders ${path}`, () => {
      const { container } = renderAt(path);
      expect(container.firstChild).not.toBeNull();
      _ = label;
    });
  }
});

describe('404 fallback', () => {
  it('shows 404 for unknown route', () => {
    renderAt('/does-not-exist');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});

let _: string;
