import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCompaniesDto } from './dto/get-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from 'src/api/enums/admin/admin-role.enum';
import { CompaniesService } from './companies.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto';
import { MessageResponseDto } from '../../responses/message-response.dto';
import { SingleCompanyResponseDto } from './dto/single-company-response';
import { companyIdParamPipe } from './param-pipes';

@ApiTags('companies')
@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.HEAD, AdminRole.SUPPORT)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // GET - endpoint to list all companies
  @Get('companies')
  @ApiOperation({ summary: 'List all companies and filter with query' })
  @ApiOkResponse({ type: GetCompaniesResponseDto })
  async getCompanies(
    @Query() getCompaniesDto: GetCompaniesDto,
  ): Promise<GetCompaniesResponseDto> {
    return this.companiesService.getCompanies(getCompaniesDto);
  }

  // GET - endpoint to show single company data
  @Get('companies/:id')
  @ApiOperation({ summary: 'Show data of single company' })
  @ApiOkResponse({ type: SingleCompanyResponseDto })
  async getCompany(
    @Param('id', companyIdParamPipe) id: string,
  ): Promise<SingleCompanyResponseDto> {
    return await this.companiesService.getCompany(id);
  }

  // PATCH - endpoint to update single company data
  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update single company data' })
  @ApiOkResponse({ type: MessageResponseDto })
  async updateCompany(
    @Param('id', companyIdParamPipe) id: string,
    @Body() updateCompanyDataDto: UpdateCompanyDto,
  ): Promise<MessageResponseDto> {
    return await this.companiesService.updateCompany(id, updateCompanyDataDto);
  }

  // DELETE - endpoint to delete single company
  @Delete('companies/:id')
  @ApiOperation({ summary: 'Delete company, change status to deleted' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteCompany(
    @Param('id', companyIdParamPipe) id: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesService.deleteCompany(id);
  }

  @Patch('companies/:id/status-suspended')
  @ApiOperation({ summary: 'Suspend company (change status to suspended)' })
  @ApiOkResponse({ type: MessageResponseDto })
  async suspendCompany(
    @Param('id', companyIdParamPipe) id: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesService.suspendCompany(id);
  }

  @Patch('companies/:id/status-active')
  @ApiOperation({ summary: 'Reactivate company (change status to active)' })
  @ApiOkResponse({ type: MessageResponseDto })
  async reactivateCompany(
    @Param('id', companyIdParamPipe) id: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesService.reactivateCompany(id);
  }

}
