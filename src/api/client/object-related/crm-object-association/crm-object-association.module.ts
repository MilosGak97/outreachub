import { Module } from '@nestjs/common';
import { CrmObjectAssociationService } from './crm-object-association.service';
import { CrmObjectAssociationController } from './crm-object-association.controller';

@Module({
  providers: [CrmObjectAssociationService],
  controllers: [CrmObjectAssociationController]
})
export class CrmObjectAssociationModule {}
