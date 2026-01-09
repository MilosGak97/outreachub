import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmTemplateModuleRepository } from '../../../repositories/postgres/template/crm-template-module.repository';
import { CompanyInstalledModuleRepository } from '../../../repositories/postgres/template/company-installed-module.repository';
import { CrmTemplateBlueprintObjectRepository } from '../../../repositories/postgres/template/crm-template-blueprint-object.repository';
import { CrmTemplateBlueprintAssociationRepository } from '../../../repositories/postgres/template/crm-template-blueprint-association.repository';
import { CrmTemplateRepository } from '../../../repositories/postgres/template/crm-template.repository';
import { CreateTemplateModuleDto } from './dto/requests/create-template-module.dto';
import { UpdateTemplateModuleDto } from './dto/requests/update-template-module.dto';
import { ModuleListResponseDto } from './dto/responses/module-list-response.dto';
import { ModuleResponseDto } from './dto/responses/module-response.dto';
import { GetModulesQueryDto } from './dto/requests/get-modules-query.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmTemplateModule } from '../../../entities/template/crm-template-module.entity';

@Injectable()
export class TemplateModulesService {
  constructor(
    private readonly moduleRepository: CrmTemplateModuleRepository,
    private readonly blueprintObjectRepository: CrmTemplateBlueprintObjectRepository,
    private readonly blueprintAssociationRepository: CrmTemplateBlueprintAssociationRepository,
    private readonly companyInstalledModuleRepository: CompanyInstalledModuleRepository,
    private readonly templateRepository: CrmTemplateRepository,
  ) {}

  async getAll(query: GetModulesQueryDto): Promise<ModuleListResponseDto> {
    const { templateId, limit, offset } = query;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    await this.ensureTemplateFound(templateId);

    const modules = await this.moduleRepository.findByTemplateId(templateId);
    const totalRecords = modules.length;
    const totalPages = Math.ceil(totalRecords / limitNumber);
    const currentPage = Math.floor(offsetNumber / limitNumber) + 1;

    const pagedModules = modules.slice(offsetNumber, offsetNumber + limitNumber);
    const result = await Promise.all(pagedModules.map((module) => this.toResponse(module)));

    return {
      result,
      totalRecords,
      totalPages,
      currentPage,
      limit: limitNumber,
      offset: offsetNumber,
    };
  }

  async getById(id: string): Promise<ModuleResponseDto> {
    const module = await this.moduleRepository.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${id}' not found`);
    }

    return this.toResponse(module);
  }

  async getFullById(id: string): Promise<CrmTemplateModule> {
    return this.moduleRepository.findWithBlueprints(id);
  }

  async create(dto: CreateTemplateModuleDto): Promise<{ id: string }> {
    await this.ensureTemplateFound(dto.templateId);
    const module = await this.moduleRepository.createModule(dto);
    return { id: module.id };
  }

  async update(id: string, dto: UpdateTemplateModuleDto): Promise<MessageResponseDto> {
    await this.moduleRepository.updateModule(id, dto);
    return { message: 'Template module updated successfully.' };
  }

  async delete(id: string): Promise<MessageResponseDto> {
    const installedCount = await this.companyInstalledModuleRepository.getCompaniesUsingModule(id);
    if (installedCount > 0) {
      throw new BadRequestException(
        'Cannot delete template module while companies have it installed.',
      );
    }

    await this.moduleRepository.deleteModule(id);
    return { message: 'Template module deleted successfully.' };
  }

  async reorder(
    templateId: string,
    orderedIds: string[],
  ): Promise<MessageResponseDto> {
    await this.ensureTemplateFound(templateId);
    await this.moduleRepository.reorderModules(templateId, orderedIds);
    return { message: 'Template modules reordered successfully.' };
  }

  private async toResponse(module: CrmTemplateModule): Promise<ModuleResponseDto> {
    const [objectsCount, associationsCount, companiesInstalled] = await Promise.all([
      this.blueprintObjectRepository.count({ where: { moduleId: module.id } }),
      this.blueprintAssociationRepository.count({ where: { moduleId: module.id } }),
      this.companyInstalledModuleRepository.getCompaniesUsingModule(module.id),
    ]);

    return {
      id: module.id,
      templateId: module.templateId,
      name: module.name,
      slug: module.slug,
      description: module.description ?? null,
      isCore: module.isCore,
      dependsOn: module.dependsOn ?? [],
      conflictsWith: module.conflictsWith ?? [],
      displayOrder: module.displayOrder,
      objectsCount,
      associationsCount,
      companiesInstalled,
      createdAt: module.createdAt,
    };
  }

  private async ensureTemplateFound(templateId: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
      select: ['id'],
    });
    if (!template) {
      throw new NotFoundException(`CRM template with id '${templateId}' not found`);
    }
  }
}
