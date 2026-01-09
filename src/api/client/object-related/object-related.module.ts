import { Module } from '@nestjs/common';
import { CrmObjectTypeModule } from './crm-object-type/crm-object-type.module';
import { CrmObjectModule } from './crm-object/crm-object.module';
import { CrmAssociationTypeModule } from './crm-association-type/crm-association-type.module';
import { CrmObjectAssociationModule } from './crm-object-association/crm-object-association.module';
import { CrmObjectFieldModule } from './crm-object-field/crm-object-field.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    CrmObjectTypeModule,
    CrmObjectModule,
    CrmAssociationTypeModule,
    CrmObjectAssociationModule,
    CrmObjectFieldModule,
    ImportModule,
  ],
  exports: [
    CrmObjectTypeModule,
    CrmObjectModule,
    CrmAssociationTypeModule,
    CrmObjectAssociationModule,
    CrmObjectFieldModule,
    ImportModule,
  ],
})
export class ObjectRelatedModule {}
