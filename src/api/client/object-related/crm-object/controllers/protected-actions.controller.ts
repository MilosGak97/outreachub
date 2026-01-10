import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserAuthGuard } from '../../../auth/user-auth.guard';
import { ProtectedActionService, CallResult, SmsResult, EmailResult } from '../services/protected-action.service';
import { InitiateCallDto } from '../dto/requests/initiate-call.dto';
import { SendSmsDto } from '../dto/requests/send-sms.dto';
import { SendEmailDto } from '../dto/requests/send-email.dto';

@Controller('client/protected-actions')
@UseGuards(UserAuthGuard)
@ApiTags('Protected Actions')
@ApiBearerAuth()
export class ProtectedActionsController {
  constructor(private readonly protectedActionService: ProtectedActionService) {}

  @Post('call')
  @ApiOperation({ summary: 'Initiate a phone call to a protected phone number' })
  async initiateCall(
    @Body() dto: InitiateCallDto,
    @Request() req: any,
  ): Promise<CallResult> {
    return this.protectedActionService.initiateCall({
      protectedValueId: dto.protectedValueId,
      companyId: req.user.companyId,
      fromNumber: dto.fromNumber,
      userId: req.user.id,
    });
  }

  @Post('sms')
  @ApiOperation({ summary: 'Send an SMS to a protected phone number' })
  async sendSms(
    @Body() dto: SendSmsDto,
    @Request() req: any,
  ): Promise<SmsResult> {
    return this.protectedActionService.sendSms({
      protectedValueId: dto.protectedValueId,
      companyId: req.user.companyId,
      message: dto.message,
      fromNumber: dto.fromNumber,
      userId: req.user.id,
    });
  }

  @Post('email')
  @ApiOperation({ summary: 'Send an email to a protected email address' })
  async sendEmail(
    @Body() dto: SendEmailDto,
    @Request() req: any,
  ): Promise<EmailResult> {
    return this.protectedActionService.sendEmail({
      protectedValueId: dto.protectedValueId,
      companyId: req.user.companyId,
      subject: dto.subject,
      body: dto.body,
      fromAddress: dto.fromAddress,
      userId: req.user.id,
    });
  }
}
