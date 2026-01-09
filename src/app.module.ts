import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from './api/email/email.module';
import { HealthController } from './app.controller';
import { AdminModule } from './api/admin/admin.module';
import { ClientModule } from './api/client/client.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Token } from './api/entities/token.entity';
import { User } from './api/entities/user.entity';
import { Company } from './api/entities/company.entity';
import { CrmAssociationType } from './api/entities/object/crm-association-type.entity';
import { CrmObject } from './api/entities/object/crm-object.entity';
import { CrmObjectAssociation } from './api/entities/object/crm-object-association.entity';
import { CrmObjectField } from './api/entities/object/crm-object-field.entity';
import { CrmObjectType } from './api/entities/object/crm-object-type.entity';
import { ObjectRelatedModule } from './api/client/object-related/object-related.module';
import { CrmObjectTypeModule } from './api/client/object-related/crm-object-type/crm-object-type.module';
import { CommonModule } from './api/common/common.module';
import { County } from './api/entities/property/county.entity';
import { Property } from './api/entities/property/property.entity';
import { PropertyListing } from './api/entities/property/property-listing.entity';
import { PropertyAiFiltering } from './api/entities/property/property-ai-filtering.entity';
import { PropertyHomeownerEnrichment } from './api/entities/property/property-homeowner-enrichment.entity';
import { Dealmachine } from './api/entities/property/dealmachine.entity';
import { UserExtrasAccess } from './api/entities/property/user-extras-access.entity';
import { UserVisibleListing } from './api/entities/property/user-visible-listing.entity';
import { PropertyBaseEnrichment } from './api/entities/property/property-base-enrichment.entity';
import { PropertyPhotoAsset } from './api/entities/property/property-photo-asset.entity';
import { PropertySummary } from './api/entities/property/property-summary.entity';
import { PropertyMosaic } from './api/entities/property/property-mosaic.entity';
import { WorkerRun } from './api/entities/worker/worker-run.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration accessible globally
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [
        Token,
        User,
        Company,
        // object-related
        CrmAssociationType,
        CrmObject,
        CrmObjectAssociation,
        CrmObjectField,
        CrmObjectType,
        // properties-related
        County,
        Property,
        PropertyListing,
        PropertyAiFiltering,
        PropertyHomeownerEnrichment,
        Dealmachine,
        UserExtrasAccess,
        UserVisibleListing,
        PropertyBaseEnrichment,
        PropertyPhotoAsset,
        PropertySummary,
        PropertyMosaic,
        WorkerRun,
      ],
      autoLoadEntities: true,
      synchronize: true,
      // Connection Pooling
      extra: {
        max: 1000, // Maximum number of connections in the pool
        min: 2, // Minimum number of idle connections in the pool
        idleTimeoutMillis: 30000, // How long a connection can be idle before being closed
      },
    }),
    EmailModule,
    AdminModule,
    ClientModule,
    ObjectRelatedModule,
    CrmObjectTypeModule,
    CommonModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
