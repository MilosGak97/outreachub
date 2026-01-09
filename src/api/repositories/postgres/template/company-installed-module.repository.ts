import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CompanyInstalledModule } from '../../../entities/template/company-installed-module.entity';
import { CrmTemplateModule } from '../../../entities/template/crm-template-module.entity';

@Injectable()
export class CompanyInstalledModuleRepository extends Repository<CompanyInstalledModule> {
  constructor(private readonly dataSource: DataSource) {
    super(CompanyInstalledModule, dataSource.createEntityManager());
  }

  async findByCompanyId(companyId: string): Promise<CompanyInstalledModule[]> {
    return this.createQueryBuilder('installedModule')
      .leftJoinAndSelect('installedModule.module', 'module')
      .where('installedModule.companyId = :companyId', { companyId })
      .orderBy('module.displayOrder', 'ASC')
      .addOrderBy('module.name', 'ASC')
      .getMany();
  }

  async isModuleInstalled(companyId: string, moduleId: string): Promise<boolean> {
    const count = await this.createQueryBuilder('installedModule')
      .where('installedModule.companyId = :companyId', { companyId })
      .andWhere('installedModule.moduleId = :moduleId', { moduleId })
      .getCount();
    return count > 0;
  }

  async install(
    companyId: string,
    moduleId: string,
    userId?: string,
  ): Promise<CompanyInstalledModule> {
    const existing = await this.findOne({ where: { companyId, moduleId } });
    if (existing) {
      throw new ConflictException('Module is already installed for this company.');
    }

    const module = await this.manager
      .getRepository(CrmTemplateModule)
      .findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${moduleId}' not found`);
    }

    const installedModule = this.create({
      companyId,
      moduleId,
      installedBy: userId,
    });

    return this.save(installedModule);
  }

  async uninstall(companyId: string, moduleId: string): Promise<void> {
    const installedModule = await this.findOne({ where: { companyId, moduleId } });
    if (!installedModule) {
      throw new NotFoundException('Module is not installed for this company.');
    }

    await this.remove(installedModule);
  }

  async getCompaniesUsingModule(moduleId: string): Promise<number> {
    return this.createQueryBuilder('installedModule')
      .where('installedModule.moduleId = :moduleId', { moduleId })
      .getCount();
  }

  async getInstalledModuleSlugs(companyId: string): Promise<string[]> {
    const rows = await this.createQueryBuilder('installedModule')
      .leftJoin('installedModule.module', 'module')
      .select('module.slug', 'slug')
      .where('installedModule.companyId = :companyId', { companyId })
      .orderBy('module.displayOrder', 'ASC')
      .getRawMany();

    return rows.map((row) => row.slug).filter(Boolean);
  }
}
