import { Module } from '@nestjs/common';
import { KekService } from './kek.service';

@Module({
  providers: [KekService],
  exports: [KekService],
})
export class CryptoModule {}
