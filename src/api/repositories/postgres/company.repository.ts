import { Company } from 'src/api/entities/company.entity';
import { DataSource, Repository } from 'typeorm';
import { GetCompaniesDto } from '../../admin/companies/dto/get-companies.dto';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCompanyDto } from '../../admin/companies/dto/update-company.dto';
import { CompanyStatus } from 'src/api/enums/company-status.enum';
import { GetCompaniesResponseDto } from '../../admin/companies/dto/get-companies-response.dto';
import { SingleCompanyResponseDto } from '../../admin/companies/dto/single-company-response';
import { MessageResponseDto } from '../../responses/message-response.dto';
import { RegisterCompanyDto } from '../../client/auth/dto/register-company.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class CompanyRepository extends Repository<Company> {
  constructor(private readonly dataSource: DataSource) {
    super(Company, dataSource.createEntityManager());
  }

  async registerCompany(registerCompanyDto: RegisterCompanyDto, user: User){
    const company = new Company()
    const {name, website} = registerCompanyDto
    company.name = name
    company.website = website
    company.users = [user]
    await this.save(company)
    return {
      message: 'Successfully registered company',
    }
  }



  // method to list all companies
  async getCompanies(
    getCompaniesDto: GetCompaniesDto,
  ): Promise<GetCompaniesResponseDto> {
    const { searchQuery, limit, offset } = getCompaniesDto;

    const numLimit = Number(limit);
    const numOffset = Number(offset);

    const query = this.createQueryBuilder('company');
    if (searchQuery) {
      query.andWhere(
        '(company.name ILIKE :searchQuery OR company.phone ILIKE :searchQuery OR company.email ILIKE :searchQuery OR company.website ILIKE :searchQuery)',
        { searchQuery: `%${searchQuery}%` },
      );
    }
    query.andWhere('(company.status != :status)', { status: 'DELETED' });
    query.take(limit);
    query.skip(offset);
    const [companies, totalRecords] = await query.getManyAndCount();
    const result = companies.map(
      ({
        id,
        name,
        website,
        phoneNumber,
        email,
        logoUrl,
        status,
        address1,
        address2,
        city,
        state,
        zipCode,
      }) => ({
        id: id ?? '/',
        name: name ?? '/',
        website: website ?? '/',
        phoneNumber: phoneNumber || null,
        email: email ?? '/',
        logoUrl: logoUrl ?? '/',
        status: status,
        address1: address1 ?? '/',
        address2: address2 ?? '/',
        city: city ?? '/',
        state: state ?? '/',
        zipCode: zipCode ?? '/',
      }),
    );
    const totalPages = Math.ceil(totalRecords / numLimit);
    const currentPage = Math.floor(numOffset / numLimit) + 1;

    return {
      result,
      totalRecords,
      totalPages,
      currentPage,
      limit: numLimit,
      offset: numOffset,
    };
  }

  // method to list single company data
  async getCompany(id: string): Promise<SingleCompanyResponseDto> {
    const company = await this.findOne({ where: { id } });
    if (!company.id) {
      throw new NotFoundException('Company with this ID is not found.');
    }

    return {
      id: company.id,
      name: company.name,
      address1: company.address1,
      address2: company.address2,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      website: company.website,
      phoneNumber: company.phoneNumber,
      email: company.email,
      logoUrl: company.logoUrl,
      status: company.status,
    };
  }

  // method to update single company data
  async updateCompany(
    id: string,
    updateCompanyDataDto: UpdateCompanyDto,
  ): Promise<{
    message: string;
  }> {
    const company = await this.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company with this ID does not exist.');
    }

    const {
      name,
      address1,
      address2,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      website,
      logoUrl,
    } = updateCompanyDataDto;

    if (name) {
      const exist = await this.findOne({ where: { name } });
      if (exist && exist.id !== id) {
        throw new ConflictException('Company with this name already exist');
      }
      company.name = name;
    }

    if (address1) {
      company.address1 = address1;
    }
    if (address2) {
      company.address2 = address2;
    }
    if (city) {
      company.city = city;
    }
    if (state) {
      company.state = state;
    }
    if (zipCode) {
      company.zipCode = zipCode;
    }

    if (phoneNumber) {
      company.phoneNumber = phoneNumber;
    }

    if (email) {
      const exist: Company = await this.findOne({ where: { email: email } });
      if (exist && exist.id !== id) {
        throw new ConflictException(
          'Company with this email address already exist',
        );
      }
      company.email = email;
    }

    if (website) {
      const exist: Company = await this.findOne({
        where: { website: website },
      });
      if (exist && exist.id !== id) {
        throw new ConflictException('Company with this website already exist');
      }
      company.website = website;
    }

    if (logoUrl) {
      company.logoUrl = logoUrl;
    }

    await this.save(company);
    return {
      message: 'The company information has been updated successfully.',
    };
  }

  // method to suspend single company per id
  async suspendCompany(id: string): Promise<MessageResponseDto> {
    const company = await this.findOne({ where: { id } });
    if (!company) {
      throw new HttpException(
        'Company with this ID does not exist.',
        HttpStatus.BAD_REQUEST,
      );
    }
    company.status = CompanyStatus.SUSPENDED;
    await this.save(company);
    return {
      message: 'Company is suspended',
    };
  }

  // method to suspend single company per id
  async reactivateCompany(id: string): Promise<MessageResponseDto> {
    const company = await this.findOne({ where: { id } });
    if (!company) {
      throw new HttpException(
        'Company with this ID does not exist.',
        HttpStatus.BAD_REQUEST,
      );
    }
    company.status = CompanyStatus.ACTIVE;
    await this.save(company);
    return {
      message: 'Company is now active',
    };
  }

  // method to delete single company
  async deleteCompany(id: string): Promise<MessageResponseDto> {
    const company = await this.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company with this ID does not exist.');
    }
    company.status = CompanyStatus.DELETED;
    await this.save(company);
    return {
      message: 'Company has been deleted successfully.',
    };
  }
}
