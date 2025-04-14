import { Module } from '@nestjs/common';
import { CrmObjectAssociationService } from './crm-object-association.service';
import { CrmObjectAssociationController } from './crm-object-association.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObjectAssociation } from '../../../entities/object-related/crm-object-association.entity';
import {
  CrmObjectAssociationRepository
} from '../../../repositories/postgres/object-related/crm-object-association.repository';

@Module({
  providers: [CrmObjectAssociationService, CrmObjectAssociationRepository],
  controllers: [CrmObjectAssociationController],
  imports: [TypeOrmModule.forFeature([CrmObjectAssociation])],
})
export class CrmObjectAssociationModule {}
