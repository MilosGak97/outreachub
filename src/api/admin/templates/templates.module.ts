import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { CrmTemplate } from '../../entities/template/crm-template.entity';
import { CrmTemplateModule } from '../../entities/template/crm-template-module.entity';
import { CrmTemplateBlueprintObject } from '../../entities/template/crm-template-blueprint-object.entity';
import { CrmTemplateBlueprintField } from '../../entities/template/crm-template-blueprint-field.entity';
import { CrmTemplateBlueprintAssociation } from '../../entities/template/crm-template-blueprint-association.entity';
import { CompanyTemplate } from '../../entities/template/company-template.entity';
import { CompanyInstalledModule } from '../../entities/template/company-installed-module.entity';
import {
  CompanyInstalledModuleRepository,
  CompanyTemplateRepository,
  CrmTemplateBlueprintAssociationRepository,
  CrmTemplateBlueprintFieldRepository,
  CrmTemplateBlueprintObjectRepository,
  CrmTemplateModuleRepository,
  CrmTemplateRepository,
} from '../../repositories/postgres/template';
import { TemplateModulesController } from './modules/template-modules.controller';
import { TemplateModulesService } from './modules/template-modules.service';
import { BlueprintObjectsController } from './blueprint-objects/blueprint-objects.controller';
import { BlueprintObjectsService } from './blueprint-objects/blueprint-objects.service';
import { BlueprintFieldsController } from './blueprint-fields/blueprint-fields.controller';
import { BlueprintFieldsService } from './blueprint-fields/blueprint-fields.service';
import { BlueprintAssociationsController } from './blueprint-associations/blueprint-associations.controller';
import { BlueprintAssociationsService } from './blueprint-associations/blueprint-associations.service';
import { TemplateInstallationService } from './installation/template-installation.service';
import { FormulaMetadataService } from '../../client/object-related/crm-object-field/formula/formula-metadata.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrmTemplate,
      CrmTemplateModule,
      CrmTemplateBlueprintObject,
      CrmTemplateBlueprintField,
      CrmTemplateBlueprintAssociation,
      CompanyTemplate,
      CompanyInstalledModule,
    ]),
  ],
  controllers: [
    TemplateModulesController,
    BlueprintObjectsController,
    BlueprintFieldsController,
    BlueprintAssociationsController,
    TemplatesController,
  ],
  providers: [
    TemplatesService,
    TemplateInstallationService,
    TemplateModulesService,
    BlueprintObjectsService,
    BlueprintFieldsService,
    BlueprintAssociationsService,
    FormulaMetadataService,
    CrmTemplateRepository,
    CrmTemplateModuleRepository,
    CrmTemplateBlueprintObjectRepository,
    CrmTemplateBlueprintFieldRepository,
    CrmTemplateBlueprintAssociationRepository,
    CompanyTemplateRepository,
    CompanyInstalledModuleRepository,
  ],
  exports: [TemplatesService, TemplateInstallationService],
})
export class TemplatesModule {}
