import { Injectable } from '@nestjs/common';
import { CompanyRepository } from '../../repositories/postgres/company.repository';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto';
import { GetCompaniesDto } from './dto/get-companies.dto';
import { MessageResponseDto } from '../../responses/message-response.dto';
import { SingleCompanyResponseDto } from './dto/single-company-response';

@Injectable()
export class CompaniesService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  // method to list all companies
  async getCompanies(
    getCompaniesDto: GetCompaniesDto,
  ): Promise<GetCompaniesResponseDto> {
    return await this.companyRepository.getCompanies(getCompaniesDto);
  }

  // method to list single company data
  async getCompany(id: string): Promise<SingleCompanyResponseDto> {
    return await this.companyRepository.getCompany(id);
  }

  // method to update single company data
  async updateCompany(
    id: string,
    updateCompanyDataDto: UpdateCompanyDto,
  ): Promise<MessageResponseDto> {
    return await this.companyRepository.updateCompany(id, updateCompanyDataDto);
  }

  // method to suspend company per id
  async suspendCompany(id: string): Promise<MessageResponseDto> {
    return await this.companyRepository.suspendCompany(id);
  }

  // method to reactivate company per id
  async reactivateCompany(id: string): Promise<MessageResponseDto> {
    return await this.companyRepository.reactivateCompany(id);
  }

  // method to delete company
  async deleteCompany(id: string): Promise<MessageResponseDto> {
    return await this.companyRepository.deleteCompany(id);
  }

}
