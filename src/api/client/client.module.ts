import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';

import { AuthModule } from './auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ObjectRelatedModule } from './object-related/object-related.module';

import { BaseCompanyRepository } from './multi-tenant-setup/base-company-repository';
import { CompanyContext } from './multi-tenant-setup/company.context';

// Entities
import { CrmObject } from '../entities/object/crm-object.entity';
import { CrmObjectType } from '../entities/object/crm-object-type.entity';
import { CrmObjectField } from '../entities/object/crm-object-field.entity';
import { CrmObjectAssociation } from '../entities/object/crm-object-association.entity';
import { CrmAssociationType } from '../entities/object/crm-association-type.entity';

type EntityClass = new () => any;

interface RepositoryConfig {
  entity: EntityClass;
  customRepository?: typeof BaseCompanyRepository;
}

const COMPANY_SCOPED_ENTITIES: RepositoryConfig[] = [
  { entity: CrmObject },
  { entity: CrmObjectType },
  { entity: CrmObjectField },
  { entity: CrmObjectAssociation },
  { entity: CrmAssociationType },
];

const repositoryProviders = COMPANY_SCOPED_ENTITIES.map(({ entity, customRepository }) => ({
  provide: getRepositoryToken(entity),
  useFactory: (dataSource: DataSource, context: CompanyContext) => {
    const RepositoryClass = customRepository || BaseCompanyRepository;
    return new RepositoryClass(entity, dataSource, context);
  },
  inject: [DataSource, CompanyContext],
}));

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls) => {
          cls.set('companyId', null); // This gets overwritten by the guard
        },
      },
    }),
    TypeOrmModule.forFeature(COMPANY_SCOPED_ENTITIES.map(e => e.entity)),
    AuthModule,
    CommonModule,
    ObjectRelatedModule,
  ],
  providers: [
    CompanyContext,
    ...repositoryProviders,
  ],
  exports: [
    CompanyContext,
    ...repositoryProviders,
  ],
})
export class ClientModule {}
