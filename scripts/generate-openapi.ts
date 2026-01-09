/**
 * Generates OpenAPI JSON specs at build time without starting the HTTP server.
 * This allows CI/CD pipelines to generate docs without a running server.
 *
 * Usage: npx ts-node scripts/generate-openapi.ts
 */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

async function generateOpenApiSpecs() {
  // Dynamically import to avoid circular dependency issues
  const { AppModule } = await import('../src/app.module');
  const { AdminModule } = await import('../src/api/admin/admin.module');
  const { ClientModule } = await import('../src/api/client/client.module');
  const { ObjectRelatedModule } = await import(
    '../src/api/client/object-related/object-related.module'
  );

  console.log('Creating NestJS application...');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'], // Reduce noise
  });

  // Admin API spec
  const adminConfig = new DocumentBuilder()
    .setTitle('Admin API')
    .setDescription('Admin Application API')
    .setVersion('1.0')
    .build();

  const optionAdmin: SwaggerDocumentOptions = {
    include: [AdminModule],
    deepScanRoutes: true,
  };

  const adminDocument = SwaggerModule.createDocument(app, adminConfig, optionAdmin);

  // Client API spec
  const clientConfig = new DocumentBuilder()
    .setTitle('Client API')
    .setDescription('Client Application API')
    .setVersion('1.0')
    .build();

  const optionClient: SwaggerDocumentOptions = {
    include: [ClientModule, ObjectRelatedModule],
    deepScanRoutes: true,
  };

  const clientDocument = SwaggerModule.createDocument(app, clientConfig, optionClient);

  // Write to docs folder
  const docsDir = path.join(__dirname, '..', 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  fs.writeFileSync(
    path.join(docsDir, 'openapi.admin.json'),
    JSON.stringify(adminDocument, null, 2),
  );
  console.log('✓ Generated docs/openapi.admin.json');

  fs.writeFileSync(
    path.join(docsDir, 'openapi.client.json'),
    JSON.stringify(clientDocument, null, 2),
  );
  console.log('✓ Generated docs/openapi.client.json');

  await app.close();
  console.log('Done!');
  process.exit(0);
}

generateOpenApiSpecs().catch((err) => {
  console.error('Failed to generate OpenAPI specs:', err);
  process.exit(1);
});
