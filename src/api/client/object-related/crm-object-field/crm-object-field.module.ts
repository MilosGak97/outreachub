import { Module } from '@nestjs/common';
import { CrmObjectFieldService } from './crm-object-field.service';
import { CrmObjectFieldController } from './crm-object-field.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObjectFieldRepository } from '../../../repositories/postgres/object/crm-object-field.repository';
import { SharedModule } from '../../multi-tenant-setup/shared-module';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { FormulaMetadataService } from './formula/formula-metadata.service';

@Module({
  providers: [CrmObjectFieldService, CrmObjectFieldRepository, FormulaMetadataService],
  controllers: [CrmObjectFieldController],
  imports: [SharedModule, TypeOrmModule.forFeature([CrmObjectField, CrmObjectType])],
})
export class CrmObjectFieldModule {}
