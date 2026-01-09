import { Injectable } from '@nestjs/common';
import { GetCompaniesUsersDto } from '../dto/get-companies-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CompanyRepository } from '../../../repositories/postgres/company.repository';
import { UserRepository } from '../../../repositories/postgres/users.repository';
import { GetCompaniesUsersResponseDto } from '../dto/get-companies-users-response.dto';
import { GetCompaniesUserResponseDto } from '../dto/get-companies-user.response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';

@Injectable()
export class CompaniesUsersService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getCompaniesUsers(
    companyId: string,
    getCompaniesUsersDto: GetCompaniesUsersDto,
  ): Promise<GetCompaniesUsersResponseDto> {
    await this.companyRepository.ensureCompanyExists(companyId);
    return this.userRepository.getCompaniesUsers(companyId, getCompaniesUsersDto);
  }

  async getCompaniesUser(
    companyId: string,
    userId: string,
  ): Promise<GetCompaniesUserResponseDto> {
    return this.userRepository.getCompaniesUser(companyId, userId);
  }

  async updateUser(
    companyId: string,
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<MessageResponseDto> {
    return this.userRepository.updateUser(
      companyId,
      userId,
      updateUserDto,
    );
  }

  async deleteUser(
    companyId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    return this.userRepository.deleteUser(companyId, userId);
  }

  async suspendUser(
    companyId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    return this.userRepository.suspendUser(companyId, userId);
  }

  async reactivateUser(
    companyId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    return this.userRepository.reactivateUser(companyId, userId);
  }

  async resetPasswordUser(
    companyId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    return this.userRepository.resetPasswordUser(companyId, userId);
  }
}
