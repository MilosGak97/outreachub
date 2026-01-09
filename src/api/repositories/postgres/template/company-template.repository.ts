import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CompanyTemplate } from '../../../entities/template/company-template.entity';
import { CrmTemplate } from '../../../entities/template/crm-template.entity';

@Injectable()
export class CompanyTemplateRepository extends Repository<CompanyTemplate> {
  constructor(private readonly dataSource: DataSource) {
    super(CompanyTemplate, dataSource.createEntityManager());
  }

  async findByCompanyId(companyId: string): Promise<CompanyTemplate | null> {
    return this.createQueryBuilder('companyTemplate')
      .leftJoinAndSelect('companyTemplate.template', 'template')
      .where('companyTemplate.companyId = :companyId', { companyId })
      .getOne();
  }

  async hasTemplate(companyId: string): Promise<boolean> {
    const count = await this.createQueryBuilder('companyTemplate')
      .where('companyTemplate.companyId = :companyId', { companyId })
      .getCount();
    return count > 0;
  }

  async install(
    companyId: string,
    templateId: string,
    userId?: string,
  ): Promise<CompanyTemplate> {
    const existing = await this.findOne({ where: { companyId } });
    if (existing) {
      throw new ConflictException('Company already has a template installed.');
    }

    const template = await this.manager
      .getRepository(CrmTemplate)
      .findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException(`CRM template with ID '${templateId}' not found`);
    }

    const companyTemplate = this.create({
      companyId,
      templateId,
      installedBy: userId,
    });

    return this.save(companyTemplate);
  }

  async getCompaniesUsingTemplate(templateId: string): Promise<number> {
    return this.createQueryBuilder('companyTemplate')
      .where('companyTemplate.templateId = :templateId', { templateId })
      .getCount();
  }
}
