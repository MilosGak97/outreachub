import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { GetAdminsDto } from './dto/get-admins.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../../enums/admin-role.enum';
import { AdminsService } from './admins.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { GetAdminsResponseDto } from './dto/get-admins-response.dto';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminResponseDto } from './dto/admin-response.dto';
import { GetAdmin } from '../auth/get-admin.decorator';
import { Admin } from '../../entities/admin.entity';

@ApiTags('Admins')
@Controller('admin')
//@UseGuards(AdminAuthGuard, RolesGuard)
//@Roles(AdminRole.HEAD)
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  // GET - end point to get all admins
  @Get('admins')
  @ApiOperation({ summary: 'Retrieve all Admin Users that matches Query' })
  @ApiOkResponse({ type: GetAdminsResponseDto })
  async getAdminUsers(
    @Query() getAdminsDto: GetAdminsDto,
  ): Promise<GetAdminsResponseDto> {
    return await this.adminsService.getAdmins(getAdminsDto);
  }

  // POST - end point to create new admin
  @Post('admins')
  @ApiOperation({ summary: 'Create new admin user as a head admin' })
  @ApiOkResponse({ type: MessageResponseDto })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @GetAdmin() admin: Admin
  ): Promise<MessageResponseDto> {
    return await this.adminsService.createAdmin(createAdminDto, admin);
  }

  // GET - end point to show information of single admin
  @Get('admins/:id')
  @ApiOperation({ summary: 'Show information of single admin' })
  @ApiOkResponse({ type: AdminResponseDto })
  async getAdmin(@Param('id') id: string): Promise<AdminResponseDto> {
    return await this.adminsService.getAdmin(id);
  }

  // PATCH - end point to update admin users field
  @Patch('admins/:id')
  @ApiOperation({ summary: 'Update admin user fields or suspend user' })
  @ApiOkResponse({ type: MessageResponseDto })
  async updateAdmin(
    @Body() updateAdminDto: UpdateAdminDto,
    @Param('id') id: string,
  ): Promise<MessageResponseDto> {
    return await this.adminsService.updateAdmin(updateAdminDto, id);
  }


  // DELETE - end point to delete admin user
  @Delete('admins/:id')
  @ApiOperation({ summary: 'Delete admin, set status to deleted ' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteAdmin(@Param('id') id: string): Promise<MessageResponseDto> {
    return await this.adminsService.deleteAdmin(id);
  }

  // PATCH - end point to suspend user by id
  @Patch('admins/:id/status-suspended')
  @ApiOperation({summary: "Suspend admin, set status to suspended"})
  @ApiOkResponse({ type: MessageResponseDto })
  async suspendAdmin(@Param('id') id: string){
    return await this.adminsService.suspendAdmin(id)
  }


  // PATCH - end point to reactivate user by id
  @Patch('admins/:id/status-active')
  @ApiOperation({summary: "Reactivate admin, set status to active"})
  @ApiOkResponse({ type: MessageResponseDto })
  async reactivateAdmin(@Param('id') id: string){
    return await this.adminsService.reactivateAdmin(id)
  }

  // POST - end point to resend email for email verification
  @Post('admins/:id/email')
  @ApiOperation({ summary: 'Re-Send email for email verification' })
  @ApiOkResponse({ type: MessageResponseDto })
  async resendEmailVerification(
    @Param('id') id: string,
  ): Promise<MessageResponseDto> {
    return await this.adminsService.resendEmailVerification(id);
  }

  // POST - end point to reset password of admin
  @Post('admins/:id/password')
  @ApiOperation({
    summary: 'Reset password and send to email, set inital password to true',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  async resetPassword(@Param('id') id: string): Promise<MessageResponseDto> {
    return await this.adminsService.resetPassword(id);
  }
}
