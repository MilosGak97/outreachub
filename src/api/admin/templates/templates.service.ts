import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmTemplateRepository } from '../../repositories/postgres/template/crm-template.repository';
import { CompanyTemplateRepository } from '../../repositories/postgres/template/company-template.repository';
import { CrmTemplateModuleRepository } from '../../repositories/postgres/template/crm-template-module.repository';
import { CreateTemplateDto } from './dto/requests/create-template.dto';
import { UpdateTemplateDto } from './dto/requests/update-template.dto';
import { TemplateListResponseDto } from './dto/responses/template-list-response.dto';
import { TemplateResponseDto } from './dto/responses/template-response.dto';
import { MessageResponseDto } from '../../responses/message-response.dto';
import { GetTemplatesQueryDto } from './dto/requests/get-templates-query.dto';
import { CrmTemplate } from '../../entities/template/crm-template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templateRepository: CrmTemplateRepository,
    private readonly templateModuleRepository: CrmTemplateModuleRepository,
    private readonly companyTemplateRepository: CompanyTemplateRepository,
  ) {}

  async getAll(query: GetTemplatesQueryDto): Promise<TemplateListResponseDto> {
    const resultSet = await this.templateRepository.findAll(query);
    const result = await Promise.all(
      resultSet.result.map((template) => this.toResponse(template)),
    );

    return {
      ...resultSet,
      result,
    };
  }

  async getById(id: string): Promise<TemplateResponseDto> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`CRM template with ID '${id}' not found`);
    }

    return this.toResponse(template);
  }

  async getBySlug(slug: string): Promise<TemplateResponseDto> {
    const template = await this.templateRepository.findBySlug(slug);
    if (!template) {
      throw new NotFoundException(`CRM template with slug '${slug}' not found`);
    }

    return this.toResponse(template);
  }

  async checkSlugAvailable(slug: string): Promise<{ available: boolean }> {
    const available = await this.templateRepository.isSlugAvailable(slug);
    return { available };
  }

  async create(dto: CreateTemplateDto): Promise<{ id: string }> {
    const template = await this.templateRepository.createTemplate(dto);
    return { id: template.id };
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<MessageResponseDto> {
    await this.templateRepository.updateTemplate(id, dto);
    return { message: 'Template updated successfully.' };
  }

  async delete(id: string): Promise<MessageResponseDto> {
    const companiesCount =
      await this.companyTemplateRepository.getCompaniesUsingTemplate(id);
    if (companiesCount > 0) {
      throw new BadRequestException(
        'Cannot delete template while companies are using it.',
      );
    }

    await this.templateRepository.deleteTemplate(id);
    return { message: 'Template deleted successfully.' };
  }

  private async toResponse(template: CrmTemplate): Promise<TemplateResponseDto> {
    const [modulesCount, companiesCount] = await Promise.all([
      this.templateModuleRepository.count({ where: { templateId: template.id } }),
      this.companyTemplateRepository.getCompaniesUsingTemplate(template.id),
    ]);

    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description ?? null,
      icon: template.icon ?? null,
      isActive: template.isActive,
      displayOrder: template.displayOrder,
      modulesCount,
      companiesCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
