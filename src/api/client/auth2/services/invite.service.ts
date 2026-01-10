import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Invite } from '../../../entities/auth/invite.entity';
import { User } from '../../../entities/user.entity';
import { Company } from '../../../entities/company.entity';
import { InviteStatus } from '../../../enums/auth2/invite-status.enum';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { UserRole } from '../../../enums/user/user-role.enum';
import { UserType } from '../../../enums/user/user-type.enum';
import { AUTH2_TOKEN_EXPIRY, AUTH2_JWT_CONFIG } from '../constants/auth2.constants';
import { CreateInviteDto, AcceptInviteDto } from '../dto/requests';
import { InviteResponseDto, InviteDetailsResponseDto } from '../dto/responses';
import { EmailService } from '../../../email/email.service';

@Injectable()
export class InviteService {
  private readonly inviteRepo: Repository<Invite>;
  private readonly userRepo: Repository<User>;
  private readonly companyRepo: Repository<Company>;
  private readonly jwtSecret: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.inviteRepo = dataSource.getRepository(Invite);
    this.userRepo = dataSource.getRepository(User);
    this.companyRepo = dataSource.getRepository(Company);
    this.jwtSecret = configService.get<string>(AUTH2_JWT_CONFIG.SECRET_ENV_KEY);
  }

  /**
   * Create and send an invite
   */
  async createInvite(
    dto: CreateInviteDto,
    inviter: User,
  ): Promise<InviteResponseDto> {
    const { email, role } = dto;

    if (!inviter.company) {
      throw new ForbiddenException('You must have a company to invite members');
    }

    // Check if user already exists with this email in this company
    const existingUser = await this.userRepo.findOne({
      where: { email, company: { id: inviter.company.id } },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists in your company');
    }

    // Check for existing pending invite
    const existingInvite = await this.inviteRepo.findOne({
      where: {
        email,
        companyId: inviter.company.id,
        status: InviteStatus.PENDING,
      },
    });
    if (existingInvite) {
      throw new ConflictException('An invite has already been sent to this email');
    }

    // Generate invite token
    const token = jwt.sign(
      { email, companyId: inviter.company.id },
      this.jwtSecret,
      { expiresIn: AUTH2_TOKEN_EXPIRY.INVITE },
    );

    // Create invite
    const invite = this.inviteRepo.create({
      email,
      token,
      role,
      status: InviteStatus.PENDING,
      companyId: inviter.company.id,
      invitedById: inviter.id,
      expiresAt: new Date(Date.now() + AUTH2_TOKEN_EXPIRY.INVITE_MS),
    });

    await this.inviteRepo.save(invite);

    // Send invite email
    const inviteUrl = `${this.configService.get('FRONTEND_URL')}/invite/${token}`;
    await this.emailService.sendInviteEmail({
      to: email,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      companyName: inviter.company.name,
      inviteUrl,
      role,
    });

    return this.toInviteResponse(invite);
  }

  /**
   * Get all pending invites for a company
   */
  async getCompanyInvites(companyId: string): Promise<InviteResponseDto[]> {
    const invites = await this.inviteRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return invites.map((invite) => this.toInviteResponse(invite));
  }

  /**
   * Revoke an invite
   */
  async revokeInvite(inviteId: string, companyId: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({
      where: { id: inviteId, companyId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be revoked');
    }

    invite.status = InviteStatus.REVOKED;
    await this.inviteRepo.save(invite);
  }

  /**
   * Get invite details by token (for the accept page)
   */
  async getInviteDetails(token: string): Promise<InviteDetailsResponseDto> {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: ['company', 'invitedBy'],
    });

    if (!invite) {
      return {
        companyName: '',
        inviterName: '',
        role: UserRole.SALES,
        email: '',
        valid: false,
        invalidReason: 'Invite not found',
      };
    }

    if (invite.status !== InviteStatus.PENDING) {
      return {
        companyName: invite.company?.name ?? '',
        inviterName: invite.invitedBy ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}` : '',
        role: invite.role,
        email: invite.email,
        valid: false,
        invalidReason: `Invite has been ${invite.status.toLowerCase()}`,
      };
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepo.save(invite);

      return {
        companyName: invite.company?.name ?? '',
        inviterName: invite.invitedBy ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}` : '',
        role: invite.role,
        email: invite.email,
        valid: false,
        invalidReason: 'Invite has expired',
      };
    }

    return {
      companyName: invite.company?.name ?? '',
      inviterName: invite.invitedBy ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}` : '',
      role: invite.role,
      email: invite.email,
      valid: true,
    };
  }

  /**
   * Accept an invite and create user
   */
  async acceptInvite(token: string, dto: AcceptInviteDto): Promise<User> {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: ['company'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(`Invite has been ${invite.status.toLowerCase()}`);
    }

    if (invite.expiresAt < new Date()) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepo.save(invite);
      throw new BadRequestException('Invite has expired');
    }

    // Check if user already exists with this email
    const existingUser = await this.userRepo.findOne({
      where: { email: invite.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.userRepo.create({
      email: invite.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneCountryCode: dto.phoneCountryCode,
      phoneNumber: dto.phoneNumber,
      emailVerified: true, // Skip email verification for invited users
      status: UserStatus.ACTIVE,
      role: invite.role,
      userType: UserType.EMPLOYEE,
      company: invite.company,
    });

    await this.userRepo.save(user);

    // Mark invite as accepted
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedById = user.id;
    invite.acceptedAt = new Date();
    await this.inviteRepo.save(invite);

    return user;
  }

  /**
   * Convert invite entity to response DTO
   */
  private toInviteResponse(invite: Invite): InviteResponseDto {
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      acceptedAt: invite.acceptedAt ?? undefined,
    };
  }
}
