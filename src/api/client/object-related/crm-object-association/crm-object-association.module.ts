import { Module } from '@nestjs/common';
import { CrmObjectAssociationService } from './crm-object-association.service';
import { CrmObjectAssociationController } from './crm-object-association.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';
import { CrmObjectAssociationRepository } from '../../../repositories/postgres/object/crm-object-association.repository';
import { SharedModule } from '../../multi-tenant-setup/shared-module';

@Module({
  providers: [CrmObjectAssociationService, CrmObjectAssociationRepository],
  controllers: [CrmObjectAssociationController],
  imports: [SharedModule, TypeOrmModule.forFeature([CrmObjectAssociation])],
})
export class CrmObjectAssociationModule {}
