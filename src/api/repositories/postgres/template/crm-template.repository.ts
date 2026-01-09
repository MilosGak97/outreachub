import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CrmTemplate } from '../../../entities/template/crm-template.entity';
import { CompanyTemplate } from '../../../entities/template/company-template.entity';
import { CreateTemplateDto } from '../../../admin/templates/dto/requests/create-template.dto';
import { UpdateTemplateDto } from '../../../admin/templates/dto/requests/update-template.dto';

type FindAllTemplatesParams = {
  limit: number;
  offset: number;
  searchQuery?: string;
  isActive?: boolean;
};

type FindAllTemplatesResponse = {
  result: CrmTemplate[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  offset: number;
};

@Injectable()
export class CrmTemplateRepository extends Repository<CrmTemplate> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmTemplate, dataSource.createEntityManager());
  }

  async findAll(params: FindAllTemplatesParams): Promise<FindAllTemplatesResponse> {
    const { limit, offset, searchQuery, isActive } = params;

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    const query = this.createQueryBuilder('template');

    if (searchQuery) {
      query.andWhere(
        '(template.name ILIKE :searchQuery OR template.slug ILIKE :searchQuery)',
        { searchQuery: `%${searchQuery}%` },
      );
    }

    if (typeof isActive === 'boolean') {
      query.andWhere('template.isActive = :isActive', { isActive });
    }

    query.orderBy('template.displayOrder', 'ASC');
    query.addOrderBy('template.name', 'ASC');
    query.take(limitNumber);
    query.skip(offsetNumber);

    const [result, totalRecords] = await query.getManyAndCount();
    const currentPage = Math.floor(offsetNumber / limitNumber) + 1;
    const totalPages = Math.ceil(totalRecords / limitNumber);

    return {
      result,
      totalRecords,
      currentPage,
      totalPages,
      limit: limitNumber,
      offset: offsetNumber,
    };
  }

  async findBySlug(slug: string): Promise<CrmTemplate | null> {
    return this.createQueryBuilder('template')
      .leftJoinAndSelect('template.modules', 'module')
      .where('template.slug = :slug', { slug })
      .getOne();
  }

  async findBySlugWithFullTree(slug: string): Promise<CrmTemplate | null> {
    return this.createQueryBuilder('template')
      .leftJoinAndSelect('template.modules', 'module')
      .leftJoinAndSelect('module.blueprintObjects', 'blueprintObject')
      .leftJoinAndSelect('blueprintObject.fields', 'blueprintField')
      .leftJoinAndSelect('module.blueprintAssociations', 'blueprintAssociation')
      .where('template.slug = :slug', { slug })
      .getOne();
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const query = this.createQueryBuilder('template')
      .where('template.slug = :slug', { slug });

    if (excludeId) {
      query.andWhere('template.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count === 0;
  }

  async createTemplate(dto: CreateTemplateDto): Promise<CrmTemplate> {
    const slugAvailable = await this.isSlugAvailable(dto.slug);
    if (!slugAvailable) {
      throw new ConflictException(`Template slug '${dto.slug}' already exists`);
    }

    const template = this.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      icon: dto.icon,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
    });

    return this.save(template);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<void> {
    const template = await this.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`CRM template with ID '${id}' not found`);
    }

    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.icon !== undefined) template.icon = dto.icon;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) template.displayOrder = dto.displayOrder;

    await this.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`CRM template with ID '${id}' not found`);
    }

    const companyTemplateCount = await this.manager
      .getRepository(CompanyTemplate)
      .createQueryBuilder('companyTemplate')
      .where('companyTemplate.templateId = :templateId', { templateId: id })
      .getCount();

    if (companyTemplateCount > 0) {
      throw new BadRequestException(
        'Cannot delete template while companies are using it.',
      );
    }

    await this.remove(template);
  }
}
