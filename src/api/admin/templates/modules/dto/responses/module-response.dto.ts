import { ApiProperty } from '@nestjs/swagger';

export class ModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  isCore: boolean;

  @ApiProperty({ type: [String] })
  dependsOn: string[];

  @ApiProperty({ type: [String] })
  conflictsWith: string[];

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  objectsCount: number;

  @ApiProperty()
  associationsCount: number;

  @ApiProperty()
  companiesInstalled: number;

  @ApiProperty()
  createdAt: Date;
}
