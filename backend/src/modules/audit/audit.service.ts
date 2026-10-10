import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { AuditEvent, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AppendAuditEvent } from './audit-event.types';

// Stable integers for the advisory lock that serialises audit chain writes.
const LOCK_KEY1 = 17349;
const LOCK_KEY2 = 82901;

/** Row shape used for hash computation. `details` is `unknown` so it accepts both the
 *  DB-returned `JsonValue | null` and the Prisma input `InputJsonValue`. */
interface HashableRow {
  ts: Date;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  outcome: string;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  details: unknown;
  prevHash: string | null;
}

export function canonicalizeAuditRow(row: HashableRow): string {
  const entries = Object.entries(row as unknown as Record<string, unknown>)
    .map(([k, v]): [string, unknown] => [k, v instanceof Date ? v.toISOString() : v])
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(entries));
}

export function computeAuditHash(row: HashableRow): string {
  return createHash('sha256').update(canonicalizeAuditRow(row)).digest('hex');
}

export interface ChainVerifyResult {
  valid: boolean;
  firstBrokenSeq?: bigint;
  checkedCount: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: AppendAuditEvent): Promise<AuditEvent> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_KEY1}, ${LOCK_KEY2})`;

      const last = await tx.auditEvent.findFirst({
        orderBy: { seq: 'desc' },
        select: { hash: true },
      });

      const prevHash = last?.hash ?? null;
      const ts = new Date();

      const hashRow: HashableRow = {
        ts,
        actorId: event.actorId ?? null,
        actorRole: event.actorRole ?? null,
        action: event.action,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        outcome: event.outcome,
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        requestId: event.requestId ?? null,
        details: event.details ?? null,
        prevHash,
      };

      const createData: Prisma.AuditEventUncheckedCreateInput = {
        ts: hashRow.ts,
        actorId: hashRow.actorId ?? undefined,
        actorRole: hashRow.actorRole ?? undefined,
        action: hashRow.action,
        targetType: hashRow.targetType ?? undefined,
        targetId: hashRow.targetId ?? undefined,
        outcome: hashRow.outcome,
        ip: hashRow.ip ?? undefined,
        userAgent: hashRow.userAgent ?? undefined,
        requestId: hashRow.requestId ?? undefined,
        details: (event.details ?? undefined) as Prisma.InputJsonValue | undefined,
        prevHash: hashRow.prevHash ?? undefined,
        hash: computeAuditHash(hashRow),
      };

      return tx.auditEvent.create({ data: createData });
    });
  }

  /** Recomputes every hash and verifies chain linkage from the first returned row. */
  async verifyChain(fromSeq?: bigint): Promise<ChainVerifyResult> {
    const events = await this.prisma.auditEvent.findMany({
      where: fromSeq !== undefined ? { seq: { gte: fromSeq } } : undefined,
      orderBy: { seq: 'asc' },
    });

    if (events.length === 0) return { valid: true, checkedCount: 0 };

    for (let i = 0; i < events.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash, seq: _seq, ...hashRow } = events[i];

      if (computeAuditHash(hashRow as unknown as HashableRow) !== hash) {
        return { valid: false, firstBrokenSeq: events[i].seq, checkedCount: i };
      }

      if (i > 0 && events[i].prevHash !== events[i - 1].hash) {
        return { valid: false, firstBrokenSeq: events[i].seq, checkedCount: i };
      }
    }

    return { valid: true, checkedCount: events.length };
  }
}
