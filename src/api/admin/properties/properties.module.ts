import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyRepository } from '../../repositories/postgres/property/property.repository';
import { PropertyListingRepository } from '../../repositories/postgres/property/property-listing.repository';
import { CountyRepository } from '../../repositories/postgres/property/county.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { County } from '../../entities/property/county.entity';
import { Property } from '../../entities/property/property.entity';
import { PropertyListing } from '../../entities/property/property-listing.entity';
import { PropertyBaseEnrichment } from '../../entities/property/property-base-enrichment.entity';
import { PropertyBaseEnrichmentRepository } from '../../repositories/postgres/property/property-base-enrichment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([County, Property, PropertyListing, PropertyBaseEnrichment]),
  ],
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    PropertyRepository,
    PropertyListingRepository,
    CountyRepository,
    PropertyBaseEnrichmentRepository,
  ],
})
export class PropertiesModule {}
