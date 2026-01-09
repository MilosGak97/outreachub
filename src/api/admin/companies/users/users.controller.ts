import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCompaniesUsersDto } from '../dto/get-companies-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminRole } from 'src/api/enums/admin/admin-role.enum';
import { CompaniesUsersService } from './users.service';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { GetCompaniesUsersResponseDto } from '../dto/get-companies-users-response.dto';
import { GetCompaniesUserResponseDto } from '../dto/get-companies-user.response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { companyIdParamPipe, userIdParamPipe } from '../param-pipes';

@ApiTags('companies/users')
@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.HEAD, AdminRole.SUPPORT)
export class CompaniesUsersController {
  constructor(
    private readonly companiesUsersService: CompaniesUsersService,
  ) {}

  @Get('companies/:id/users')
  @ApiOperation({
    summary: 'List all users that belong to this company',
  })
  @ApiOkResponse({ type: GetCompaniesUsersResponseDto })
  async getCompaniesUsers(
    @Param('id', companyIdParamPipe) companyId: string,
    @Query() getCompaniesUsersDto: GetCompaniesUsersDto,
  ): Promise<GetCompaniesUsersResponseDto> {
    return await this.companiesUsersService.getCompaniesUsers(
      companyId,
      getCompaniesUsersDto,
    );
  }

  @Get('companies/:companyId/users/:id')
  @ApiOperation({ summary: 'Show user data including company information' })
  @ApiOkResponse({ type: GetCompaniesUserResponseDto })
  async getCompaniesUser(
    @Param('companyId', companyIdParamPipe) companyId: string,
    @Param('id', userIdParamPipe) userId: string,
  ): Promise<GetCompaniesUserResponseDto> {
    return await this.companiesUsersService.getCompaniesUser(
      companyId,
      userId,
    );
  }

  @Patch('companies/:companyId/users/:id')
  @ApiOperation({ summary: 'Update user fields' })
  @ApiOkResponse({ type: MessageResponseDto })
  async updateUser(
    @Param('companyId', companyIdParamPipe) companyId: string,
    @Param('id', userIdParamPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<MessageResponseDto> {
    return await this.companiesUsersService.updateUser(
      companyId,
      userId,
      updateUserDto,
    );
  }

  @Delete('companies/:companyId/users/:id')
  @ApiOperation({ summary: 'Delete user (change UserStatus to deleted)' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteUser(
    @Param('companyId', companyIdParamPipe) companyId: string,
    @Param('id', userIdParamPipe) userId: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesUsersService.deleteUser(companyId, userId);
  }

  @Patch('companies/:companyId/users/:id/status-suspended')
  @ApiOperation({ summary: 'Suspend user (change UserStatus to suspended)' })
  @ApiOkResponse({ type: MessageResponseDto })
  async suspendUser(
    @Param('companyId', companyIdParamPipe) companyId: string,
    @Param('id', userIdParamPipe) userId: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesUsersService.suspendUser(companyId, userId);
  }

  @Patch('companies/:companyId/users/:id/status-active')
  @ApiOperation({ summary: 'Activate user' })
  @ApiOkResponse({ type: MessageResponseDto })
  async reactivateUser(
    @Param('companyId', companyIdParamPipe) companyId: string,
    @Param('id', userIdParamPipe) userId: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesUsersService.reactivateUser(
      companyId,
      userId,
    );
  }

  @Post('companies/:companyId/users/:id/password')
  @ApiOperation({ summary: 'Reset client password' })
  @ApiOkResponse({ type: MessageResponseDto })
  async resetPasswordUser(
    @Param('companyId', companyIdParamPipe) companyId: string,
    @Param('id', userIdParamPipe) userId: string,
  ): Promise<MessageResponseDto> {
    return await this.companiesUsersService.resetPasswordUser(
      companyId,
      userId,
    );
  }
}
