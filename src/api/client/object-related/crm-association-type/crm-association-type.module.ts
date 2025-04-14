import { Module } from '@nestjs/common';
import { CrmAssociationTypeService } from './crm-association-type.service';
import { CrmAssociationTypeController } from './crm-association-type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmAssociationType } from '../../../entities/object-related/crm-association-type.entity';
import {
  CrmAssociationTypeRepository
} from '../../../repositories/postgres/object-related/crm-association-type.repository';

@Module({
  providers: [CrmAssociationTypeService, CrmAssociationTypeRepository],
  controllers: [CrmAssociationTypeController],
  imports: [TypeOrmModule.forFeature([CrmAssociationType])]
})
export class CrmAssociationTypeModule {}
