import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PropertyStatus } from '../../../enums/property/property-status.enum';
import { FilteredStatus } from '../../../enums/property/filtered-status.enum';
import { HomeType } from '../../../enums/property/home-type.enum';

export class PropertyListingItemDto {
  @ApiPropertyOptional()
  listingId?: string;

  @ApiPropertyOptional()
  propertyId?: string;

  @ApiPropertyOptional()
  zpid?: string;

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional({ enum: PropertyStatus, enumName: 'PropertyStatus' })
  status?: PropertyStatus;

  @ApiPropertyOptional()
  statusDate?: Date;

  @ApiPropertyOptional({ enum: FilteredStatus, enumName: 'FilteredStatus' })
  filteredStatus?: FilteredStatus;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  zipcode?: string;

  @ApiPropertyOptional()
  streetAddress?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  bedrooms?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  bathrooms?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  livingAreaSqft?: number;

  @ApiPropertyOptional()
  @Type(() => Boolean)
  has3DModel?: boolean;

  @ApiPropertyOptional()
  longitude?: string;

  @ApiPropertyOptional()
  latitude?: string;

  @ApiPropertyOptional()
  county?: string;

  @ApiPropertyOptional({ enum: HomeType, enumName: 'HomeType' })
  homeType?: HomeType;

  @ApiPropertyOptional()
  @Type(() => Number)
  photoCount?: number;

  @ApiPropertyOptional()
  realtorName?: string;

  @ApiPropertyOptional()
  realtorPhone?: string;

  @ApiPropertyOptional()
  brokerName?: string;

  @ApiPropertyOptional()
  mosaicS3Key?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
