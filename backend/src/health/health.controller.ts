import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { StorageProbe } from './storage.probe';

type Status = 'up' | 'down';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageProbe,
  ) {}

  /** Liveness: the process is up. Does not touch dependencies. */
  @Get()
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness: 200 only if every M0 dependency is reachable; 503 otherwise. */
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response): Promise<{ db: Status; storage: Status }> {
    const [db, storage] = await Promise.all([this.prisma.ping(), this.storage.ping()]);
    if (!db || !storage) res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { db: db ? 'up' : 'down', storage: storage ? 'up' : 'down' };
  }
}
