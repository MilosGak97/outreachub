// src/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CompanyContext } from './company.context';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
  ],
  providers: [CompanyContext],
  exports: [CompanyContext],
})
export class SharedModule {}