import { ApiProperty } from '@nestjs/swagger';

export class ProtectedFieldActionResponseDto {
  @ApiProperty({ example: 'call', description: 'Action type: call, sms, email, postcard, directions' })
  type: string;

  @ApiProperty({ example: true, description: 'Whether this action is currently enabled' })
  enabled: boolean;
}
