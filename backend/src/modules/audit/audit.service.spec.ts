import { createHash } from 'node:crypto';
import { canonicalizeAuditRow, computeAuditHash } from './audit.service';
import type { AuditEvent } from '../../generated/prisma/client';

type AuditRow = Omit<AuditEvent, 'seq' | 'hash'>;

const BASE_ROW: AuditRow = {
  ts: new Date('2026-10-09T10:00:00.000Z'),
  actorId: null,
  actorRole: null,
  action: 'SESSION_CREATED',
  targetType: null,
  targetId: null,
  outcome: 'SUCCESS',
  ip: '127.0.0.1',
  userAgent: null,
  requestId: 'req-1',
  details: null,
  prevHash: null,
};

describe('canonicalizeAuditRow', () => {
  it('produces the same string for identical input', () => {
    expect(canonicalizeAuditRow(BASE_ROW)).toBe(canonicalizeAuditRow(BASE_ROW));
  });

  it('serialises Dates as ISO strings', () => {
    const json = canonicalizeAuditRow(BASE_ROW);
    expect(json).toContain('2026-10-09T10:00:00.000Z');
  });

  it('keys are sorted alphabetically', () => {
    const parsed = JSON.parse(canonicalizeAuditRow(BASE_ROW)) as Record<string, unknown>;
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());
  });

  it('null values are included, undefined values are excluded', () => {
    const rowWithUndefined = { ...BASE_ROW, actorId: undefined as unknown as null };
    const canonical = canonicalizeAuditRow(rowWithUndefined);
    const parsed = JSON.parse(canonical) as Record<string, unknown>;
    expect('actorId' in parsed).toBe(false);
    expect('outcome' in parsed).toBe(true);
  });

  it('produces different output when a field changes', () => {
    const modified = { ...BASE_ROW, outcome: 'FAILURE' };
    expect(canonicalizeAuditRow(BASE_ROW)).not.toBe(canonicalizeAuditRow(modified as AuditRow));
  });
});

describe('computeAuditHash', () => {
  it('equals SHA-256 of the canonical JSON', () => {
    const canonical = canonicalizeAuditRow(BASE_ROW);
    const expected = createHash('sha256').update(canonical).digest('hex');
    expect(computeAuditHash(BASE_ROW)).toBe(expected);
  });

  it('is deterministic', () => {
    expect(computeAuditHash(BASE_ROW)).toBe(computeAuditHash(BASE_ROW));
  });

  it('changes when prevHash changes', () => {
    const row1 = { ...BASE_ROW, prevHash: null };
    const row2 = { ...BASE_ROW, prevHash: 'abc123' };
    expect(computeAuditHash(row1)).not.toBe(computeAuditHash(row2));
  });

  it('changes when any field changes', () => {
    const modified = { ...BASE_ROW, action: 'LOGIN_FAILED' };
    expect(computeAuditHash(BASE_ROW)).not.toBe(computeAuditHash(modified as AuditRow));
  });

  it('produces a 64-character hex string (SHA-256)', () => {
    const hash = computeAuditHash(BASE_ROW);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
