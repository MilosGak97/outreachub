import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectService } from './crm-object.service';
import { CrmObjectController } from './crm-object.controller';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';
import { CrmObjectFieldRepository } from '../../../repositories/postgres/object/crm-object-field.repository';
import { CrmObjectAssociationRepository } from '../../../repositories/postgres/object/crm-object-association.repository';
import { ProtectedModule } from '../../../common/protected/protected.module';
import { ProtectedFieldTransformerService } from './services/protected-field-transformer.service';
import { ProtectedFieldIngestionService } from './services/protected-field-ingestion.service';
import { ProtectedActionService } from './services/protected-action.service';
import { ProtectedActionsController } from './controllers/protected-actions.controller';
import { FieldValueValidatorService } from './services/field-value-validator.service';
import { SharedModule } from '../../multi-tenant-setup/shared-module';
import { CrmObjectAssociationModule } from '../crm-object-association/crm-object-association.module';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([CrmObject]),
    ProtectedModule,
    CrmObjectAssociationModule,
  ],
  controllers: [
    CrmObjectController,
    ProtectedActionsController,
  ],
  providers: [
    CrmObjectService,
    CrmObjectRepository,
    CrmObjectFieldRepository,
    CrmObjectAssociationRepository,
    ProtectedFieldTransformerService,
    ProtectedFieldIngestionService,
    ProtectedActionService,
    FieldValueValidatorService,
  ],
  exports: [CrmObjectService, CrmObjectRepository],
})
export class CrmObjectModule {}
