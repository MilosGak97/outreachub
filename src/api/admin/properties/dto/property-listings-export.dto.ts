import { OmitType } from '@nestjs/swagger';
import { PropertyListingsSearchDto } from './property-listings-search.dto';

export class PropertyListingsExportDto extends OmitType(PropertyListingsSearchDto, ['limit', 'offset'] as const) {}
