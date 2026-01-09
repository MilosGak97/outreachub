import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertiesDynamoService } from './properties-dynamo.service';

class DynamoHealthResponse {
  region?: string;
  table: string;
  tableReachable: boolean;
  error?: string;
}

@ApiTags('common')
@Controller('common/aws')
export class AwsController {
  constructor(private readonly propertiesDynamoService: PropertiesDynamoService) {}

  @ApiOperation({ summary: 'Health check for DynamoDB connectivity' })
  @ApiOkResponse({ type: DynamoHealthResponse })
  @Get('dynamo-health')
  async dynamoHealth(): Promise<DynamoHealthResponse> {
    return this.propertiesDynamoService.healthCheck();
  }
}
