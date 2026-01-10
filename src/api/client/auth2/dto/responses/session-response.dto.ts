import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty({ description: 'Session/token ID' })
  id: string;

  @ApiProperty({ description: 'When the session was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the session expires' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'Whether this is the current session' })
  isCurrent?: boolean;

  @ApiPropertyOptional({ description: 'Last activity timestamp' })
  lastUsedAt?: Date;
}

export class SessionListResponseDto {
  @ApiProperty({ type: [SessionDto] })
  sessions: SessionDto[];
}