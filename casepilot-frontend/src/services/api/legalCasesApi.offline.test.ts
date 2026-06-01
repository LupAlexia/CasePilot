import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLegalCase,
  getLegalCases,
  syncPendingLegalCaseOperations
} from './legalCasesApi';
import type { LegalCaseInput } from './types';

const CASES_CACHE_KEY = 'casepilot:legalCases:cache';
const CASES_PENDING_OPS_KEY = 'casepilot:legalCases:pendingOps';

const payload: LegalCaseInput = {
  number: '123/2026',
  registrationDate: '2026-04-18',
  court: 'Tribunal Bucuresti',
  object: 'Contestatie',
  reclamant: 'Ion Popescu',
  parat: 'Maria Ionescu',
  stage: 1,
  status: 1
};

describe('legalCasesApi offline support', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true
    });
  });

  it('creates case locally when offline and queues operation', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    });

    const createdCase = await createLegalCase(payload);

    expect(createdCase.id.startsWith('local-')).toBe(true);

    const cachedCases = JSON.parse(localStorage.getItem(CASES_CACHE_KEY) ?? '[]') as Array<{ id: string }>;
    const pendingOps = JSON.parse(localStorage.getItem(CASES_PENDING_OPS_KEY) ?? '[]') as Array<{ type: string }>;

    expect(cachedCases).toHaveLength(1);
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.type).toBe('create');
  });

  it('falls back to local cache when network is unreachable', async () => {
    localStorage.setItem(
      CASES_CACHE_KEY,
      JSON.stringify([
        {
          id: 'c-1',
          ...payload,
          documents: [],
          hearings: []
        }
      ])
    );

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await getLegalCases(1, 10);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('c-1');
  });

  it('syncs queued create operations after reconnect', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    });

    const localCase = await createLegalCase(payload);

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'server-1',
          ...payload,
          documents: [],
          hearings: []
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    );

    await syncPendingLegalCaseOperations();

    const cachedCases = JSON.parse(localStorage.getItem(CASES_CACHE_KEY) ?? '[]') as Array<{ id: string }>;
    const pendingOps = JSON.parse(localStorage.getItem(CASES_PENDING_OPS_KEY) ?? '[]') as unknown[];

    expect(cachedCases[0]?.id).toBe('server-1');
    expect(cachedCases.some((item) => item.id === localCase.id)).toBe(false);
    expect(pendingOps).toHaveLength(0);
  });
});
