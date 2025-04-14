import { Module } from '@nestjs/common';
import { CrmAssociationTypeService } from './crm-association-type.service';
import { CrmAssociationTypeController } from './crm-association-type.controller';

@Module({
  providers: [CrmAssociationTypeService],
  controllers: [CrmAssociationTypeController]
})
export class CrmAssociationTypeModule {}
