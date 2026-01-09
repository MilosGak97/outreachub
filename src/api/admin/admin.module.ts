import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { AdminsModule } from './admins/admins.module';
import { CommonModule } from '../common/common.module';
import { PropertiesModule } from './properties/properties.module';
import { ScraperModule } from './scraper/scraper.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    AdminsModule,
    AuthModule,
    CompaniesModule,
    CommonModule,
    PropertiesModule,
    ScraperModule,
    TemplatesModule,
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}
