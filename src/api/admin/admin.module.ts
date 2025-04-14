import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { AdminsModule } from './admins/admins.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [AdminsModule, AuthModule, CompaniesModule, CommonModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
