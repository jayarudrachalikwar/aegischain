/**
 * SR-17 integration tests — run only with E2E_REAL_INFRA=1 (needs a migrated PostgreSQL).
 *
 * Verifies:
 *   - append() produces a valid hash chain
 *   - verifyChain() reports valid on an untouched chain
 *   - verifyChain() reports the first broken seq after a raw SQL UPDATE (bypassing the trigger
 *     from a superuser perspective would require disabling it, so we test the trigger fires first)
 *   - the audit_events UPDATE trigger rejects modifications
 */
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { AuditService } from '../src/modules/audit/audit.service';
import { PrismaService } from '../src/database/prisma.service';
import { testEnv } from './helpers';

const REAL_INFRA = process.env['E2E_REAL_INFRA'] === '1';

(REAL_INFRA ? describe : describe.skip)('SR-17: audit chain (real infra)', () => {
  let app: INestApplication;
  let audit: AuditService;
  let prisma: PrismaService;

  beforeAll(async () => {
    testEnv({
      DATABASE_URL:
        process.env['DATABASE_URL'] ??
        'postgresql://aegis:aegis_dev_only@127.0.0.1:55432/aegischain',
    });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    audit = app.get(AuditService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$executeRaw`ALTER TABLE audit_events DISABLE TRIGGER ALL`.catch(() => undefined);
    await prisma.$executeRaw`DELETE FROM audit_events`.catch(() => undefined);
    await prisma.$executeRaw`ALTER TABLE audit_events ENABLE TRIGGER ALL`.catch(() => undefined);
    await app.close();
  });

  afterEach(async () => {
    await prisma.$executeRaw`ALTER TABLE audit_events DISABLE TRIGGER ALL`;
    await prisma.$executeRaw`DELETE FROM audit_events`;
    await prisma.$executeRaw`ALTER TABLE audit_events ENABLE TRIGGER ALL`;
  });

  it('append() builds a valid chain across multiple events', async () => {
    await audit.append({ action: 'SESSION_CREATED', outcome: 'SUCCESS' });
    await audit.append({ action: 'ASSET_UPLOADED', outcome: 'SUCCESS' });
    await audit.append({ action: 'ACCESS_REQUESTED', outcome: 'SUCCESS' });

    const result = await audit.verifyChain();
    expect(result.valid).toBe(true);
    expect(result.checkedCount).toBe(3);
  });

  it('first event has prevHash = null', async () => {
    await audit.append({ action: 'SESSION_CREATED', outcome: 'SUCCESS' });
    const events = await prisma.auditEvent.findMany({ orderBy: { seq: 'asc' } });
    expect(events[0].prevHash).toBeNull();
  });

  it('each event prevHash equals the hash of the preceding event', async () => {
    await audit.append({ action: 'SESSION_CREATED', outcome: 'SUCCESS' });
    await audit.append({ action: 'LOGIN_FAILED', outcome: 'FAILURE' });
    const [e1, e2] = await prisma.auditEvent.findMany({ orderBy: { seq: 'asc' } });
    expect(e2.prevHash).toBe(e1.hash);
  });

  it('verifyChain() detects a tampered hash (SR-17)', async () => {
    await audit.append({ action: 'SESSION_CREATED', outcome: 'SUCCESS' });
    await audit.append({ action: 'ASSET_UPLOADED', outcome: 'SUCCESS' });

    const [first] = await prisma.auditEvent.findMany({ orderBy: { seq: 'asc' } });

    // Bypass the trigger by disabling it temporarily (superuser in dev).
    // In production the aegis_app role can't even attempt this.
    await prisma.$executeRaw`ALTER TABLE audit_events DISABLE TRIGGER audit_no_update`;
    await prisma.$executeRaw`UPDATE audit_events SET hash = 'deadbeef' WHERE seq = ${first.seq}`;
    await prisma.$executeRaw`ALTER TABLE audit_events ENABLE TRIGGER audit_no_update`;

    const result = await audit.verifyChain();
    expect(result.valid).toBe(false);
    expect(result.firstBrokenSeq).toBe(first.seq);
  });

  it('UPDATE trigger rejects modifications (SR-17)', async () => {
    await audit.append({ action: 'SESSION_CREATED', outcome: 'SUCCESS' });
    const [ev] = await prisma.auditEvent.findMany();

    await expect(
      prisma.$executeRaw`UPDATE audit_events SET outcome = 'FAILURE' WHERE seq = ${ev.seq}`,
    ).rejects.toThrow(/append-only/i);
  });

  it('DELETE trigger rejects deletions (SR-17)', async () => {
    await audit.append({ action: 'SESSION_CREATED', outcome: 'SUCCESS' });
    const [ev] = await prisma.auditEvent.findMany();

    await expect(
      prisma.$executeRaw`DELETE FROM audit_events WHERE seq = ${ev.seq}`,
    ).rejects.toThrow(/append-only/i);
  });
});
