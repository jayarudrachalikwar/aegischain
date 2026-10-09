import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from '../config/config.module';
import type { AppConfig } from '../config/env';

/** Checks MinIO via its unauthenticated readiness endpoint. Never throws. */
@Injectable()
export class StorageProbe {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async ping(): Promise<boolean> {
    try {
      const url = new URL('/minio/health/ready', this.config.MINIO_ENDPOINT);
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
