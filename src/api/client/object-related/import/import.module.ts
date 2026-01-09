import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../multi-tenant-setup/shared-module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ImportFile } from '../../../entities/import/import-file.entity';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { ImportObjectMap } from '../../../entities/import/import-object-map.entity';
import { ImportDraftField } from '../../../entities/import/import-draft-field.entity';
import { ImportFieldMap } from '../../../entities/import/import-field-map.entity';
import { ImportMatchRule } from '../../../entities/import/import-match-rule.entity';
import { ImportLinkRule } from '../../../entities/import/import-link-rule.entity';
import { ImportDraftAssociationType } from '../../../entities/import/import-draft-association-type.entity';
import { ImportRow } from '../../../entities/import/import-row.entity';
import { ImportRowResult } from '../../../entities/import/import-row-result.entity';
import { ImportJob } from '../../../entities/import/import-job.entity';
import { ImportFileRepository } from '../../../repositories/postgres/import/import-file.repository';
import { ImportSessionRepository } from '../../../repositories/postgres/import/import-session.repository';
import { ImportObjectMapRepository } from '../../../repositories/postgres/import/import-object-map.repository';
import { ImportDraftFieldRepository } from '../../../repositories/postgres/import/import-draft-field.repository';
import { ImportFieldMapRepository } from '../../../repositories/postgres/import/import-field-map.repository';
import { ImportMatchRuleRepository } from '../../../repositories/postgres/import/import-match-rule.repository';
import { ImportLinkRuleRepository } from '../../../repositories/postgres/import/import-link-rule.repository';
import { ImportDraftAssociationTypeRepository } from '../../../repositories/postgres/import/import-draft-association-type.repository';
import { ImportRowRepository } from '../../../repositories/postgres/import/import-row.repository';
import { ImportRowResultRepository } from '../../../repositories/postgres/import/import-row-result.repository';
import { ImportJobRepository } from '../../../repositories/postgres/import/import-job.repository';
import { ImportStorageService } from './import-storage.service';
import { CrmAssociationTypeRepository } from '../../../repositories/postgres/object/crm-association-type.repository';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      ImportFile,
      ImportSession,
      ImportObjectMap,
      ImportDraftField,
      ImportFieldMap,
      ImportMatchRule,
      ImportLinkRule,
      ImportDraftAssociationType,
      ImportRow,
      ImportRowResult,
      ImportJob,
    ]),
  ],
  providers: [
    ImportService,
    ImportStorageService,
    ImportFileRepository,
    ImportSessionRepository,
    ImportObjectMapRepository,
    ImportDraftFieldRepository,
    ImportFieldMapRepository,
    ImportMatchRuleRepository,
    ImportLinkRuleRepository,
    ImportDraftAssociationTypeRepository,
    ImportRowRepository,
    ImportRowResultRepository,
    ImportJobRepository,
    CrmAssociationTypeRepository,
  ],
  controllers: [ImportController],
})
export class ImportModule {}
