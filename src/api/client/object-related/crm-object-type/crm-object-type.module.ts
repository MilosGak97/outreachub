// src/api/client/object-related/crm-object-type/crm-object-type.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObjectTypeService } from './crm-object-type.service';
import { CrmObjectTypeController } from './crm-object-type.controller';
import { DataSource } from 'typeorm';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';
import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { CompanyContext } from '../../multi-tenant-setup/company.context';
import { CrmObjectTypeRepository } from '../../../repositories/postgres/object/crm-object-type.repository';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';
import { CrmObjectAssociationRepository } from '../../../repositories/postgres/object/crm-object-association.repository';
import { CrmAssociationTypeRepository } from '../../../repositories/postgres/object/crm-association-type.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrmObjectType,
      CrmObject,
      CrmObjectAssociation,
      CrmAssociationType,
    ]),
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
    {
      provide: CrmObjectRepository,
      useFactory: (dataSource: DataSource, companyContext: CompanyContext) => {
        return new CrmObjectRepository(dataSource, companyContext);
      },
      inject: [DataSource, CompanyContext],
    },
    {
      provide: CrmObjectAssociationRepository,
      useFactory: (dataSource: DataSource, companyContext: CompanyContext) => {
        return new CrmObjectAssociationRepository(dataSource, companyContext);
      },
      inject: [DataSource, CompanyContext],
    },
    {
      provide: CrmAssociationTypeRepository,
      useFactory: (dataSource: DataSource, companyContext: CompanyContext) => {
        return new CrmAssociationTypeRepository(dataSource, companyContext);
      },
      inject: [DataSource, CompanyContext],
    },
    CrmObjectTypeService,
  ],
  controllers: [CrmObjectTypeController],
})
export class CrmObjectTypeModule {}
