import { Module } from '@nestjs/common';
import { ObjectTypeModule } from './crm-object-type/crm-object-type.module';
import { CrmObjectModule } from './crm-object/crm-object.module';
import { CrmAssociationTypeModule } from './crm-association-type/crm-association-type.module';
import { CrmObjectAssociationModule } from './crm-object-association/crm-object-association.module';
import { CrmObjectFieldModule } from './crm-object-field/crm-object-field.module';

@Module({
  imports: [
    ObjectTypeModule,
    CrmObjectModule,
    CrmAssociationTypeModule,
    CrmObjectAssociationModule,
    CrmObjectFieldModule,
  ],
  exports: [
    ObjectTypeModule,
    CrmObjectModule,
    CrmAssociationTypeModule,
    CrmObjectAssociationModule,
    CrmObjectFieldModule,
  ],
})
export class ObjectRelatedModule {}
