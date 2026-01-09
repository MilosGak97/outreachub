// src/api/client/object-related/crm-object-type/crm-object-type.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObjectTypeService } from './crm-object-type.service';
import { CrmObjectTypeController } from './crm-object-type.controller';
import { DataSource } from 'typeorm';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { CompanyContext } from '../../multi-tenant-setup/company.context';
import { CrmObjectTypeRepository } from '../../../repositories/postgres/object/crm-object-type.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmObjectType]),
  ],
  providers: [
    CompanyContext,
    {
      provide: CrmObjectTypeRepository,
      useFactory: (dataSource: DataSource, companyContext: CompanyContext) => {
        return new CrmObjectTypeRepository(dataSource, companyContext);
      },
      inject: [DataSource, CompanyContext],
    },
    CrmObjectTypeService,
  ],
  controllers: [CrmObjectTypeController],
})
export class CrmObjectTypeModule {}