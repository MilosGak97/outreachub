import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScrapeRunsDynamoRepository } from '../../repositories/dynamodb/scrape-runs-dynamo.repository';
import { ScrapeJobsDynamoRepository } from '../../repositories/dynamodb/scrape-jobs-dynamo.repository';
import { ScrapeStateConfigDynamoRepository } from '../../repositories/dynamodb/scrape-state-config-dynamo.repository';
import { PropertiesOutreachDynamoRepository } from '../../repositories/dynamodb/properties-outreach-dynamo.repository';
import { ZillowCookiesDynamoRepository } from '../../repositories/dynamodb/zillow-cookies-dynamo.repository';
import { PropertyPipelineStatsRepository } from '../../repositories/postgres/property/property-pipeline-stats.repository';
import { PropertySummaryRepository } from '../../repositories/postgres/property/property-summary.repository';
import { WorkerRunsModule } from './worker-runs/worker-runs.module';

@Module({
  imports: [WorkerRunsModule],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    ScrapeRunsDynamoRepository,
    ScrapeJobsDynamoRepository,
    ScrapeStateConfigDynamoRepository,
    PropertiesOutreachDynamoRepository,
    ZillowCookiesDynamoRepository,
    PropertyPipelineStatsRepository,
    PropertySummaryRepository,
  ],
})
export class ScraperModule {}
