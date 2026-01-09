import { Global, Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ECSClient } from '@aws-sdk/client-ecs';
import { S3Client } from '@aws-sdk/client-s3';
import { PropertiesDynamoService } from './properties-dynamo.service';
import { CountiesDynamoService } from './counties-dynamo.service';

@Global()
@Module({
  providers: [
    {
      provide: DynamoDBClient,
      useFactory: () =>
        new DynamoDBClient({
          region: 'us-east-2',
          credentials: process.env.AWS_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN,
              }
            : undefined,
        }),
    },
    {
      provide: S3Client,
      useFactory: () =>
        new S3Client({
          region: process.env.AWS_REGION || 'us-east-2',
          credentials: process.env.AWS_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN,
              }
            : undefined,
        }),
    },
    {
      provide: ECSClient,
      useFactory: () =>
        new ECSClient({
          region: process.env.AWS_REGION || 'us-east-2',
          credentials: process.env.AWS_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN,
              }
            : undefined,
        }),
    },
    PropertiesDynamoService,
    CountiesDynamoService,
  ],
  exports: [
    DynamoDBClient,
    S3Client,
    ECSClient,
    PropertiesDynamoService,
    CountiesDynamoService,
  ],
})
export class AwsModule {}
