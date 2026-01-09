import { Module } from '@nestjs/common';
import { CrmObjectService } from './crm-object.service';
import { CrmObjectController } from './crm-object.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';
import { SharedModule } from '../../multi-tenant-setup/shared-module';

@Module({
  providers: [CrmObjectService, CrmObjectRepository],
  controllers: [CrmObjectController],
  imports: [SharedModule, TypeOrmModule.forFeature([CrmObject])],
})
export class CrmObjectModule {}
