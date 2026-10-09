import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { StorageProbe } from './storage.probe';

@Module({ controllers: [HealthController], providers: [StorageProbe] })
export class HealthModule {}
