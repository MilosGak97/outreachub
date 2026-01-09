import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { AdminModule } from './api/admin/admin.module';
import { ClientModule } from './api/client/client.module';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { ObjectRelatedModule } from './api/client/object-related/object-related.module';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase the request body limit to 100MB
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  // Use cookie-parser
  app.use(cookieParser());

  // Set global prefix
  // app.setGlobalPrefix('api');

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const adminTagOrder = [
    'auth',
    'admin',
    'common',
    'companies',
    'properties',
    'scraper',
    'scraper/workers',
    'templates',
    'templates/modules',
    'templates/blueprint-objects',
    'templates/blueprint-fields',
    'templates/blueprint-associations',
  ];

  // Swagger setup for Admin API
  const adminConfigBuilder = new DocumentBuilder()
    .setTitle('Admin API')
    .setDescription('Admin Application API')
    .setVersion('1.0');

  adminTagOrder.forEach((tag) => adminConfigBuilder.addTag(tag));
  const adminConfig = adminConfigBuilder.build();

  const optionAdmin: SwaggerDocumentOptions = {
    include: [AdminModule],
    deepScanRoutes: true,
  };

  const adminDocument = SwaggerModule.createDocument(
    app,
    adminConfig,
    optionAdmin,
  ); // No include option here

  const adminTagMetadata = new Map((adminDocument.tags ?? []).map((tag) => [tag.name, tag]));
  const orderedAdminTags = adminTagOrder.map((name) => adminTagMetadata.get(name) ?? { name });
  const extraAdminTags = (adminDocument.tags ?? []).filter((tag) => !adminTagOrder.includes(tag.name));
  adminDocument.tags = [...orderedAdminTags, ...extraAdminTags];

  SwaggerModule.setup('admin', app, adminDocument); // Admin Swagger UI

  const httpAdapter = app.getHttpAdapter();

  // Expose the Admin API OpenAPI JSON
  httpAdapter.get('/admin/api-json', (_req, res) => {
    httpAdapter.reply(res, adminDocument);
  });

  // Swagger setup for Client API
  const clientConfig = new DocumentBuilder()
    .setTitle('Client API')
    .setDescription('Client Application API')
    .setVersion('1.0')
    .build();

  const optionClient: SwaggerDocumentOptions = {
    include: [ClientModule, ObjectRelatedModule],
    deepScanRoutes: true,
  };

  const clientDocument = SwaggerModule.createDocument(
    app,
    clientConfig,
    optionClient,
  );

  SwaggerModule.setup('client', app, clientDocument); // Client Swagger UI
  // Expose the Client API OpenAPI JSON
  httpAdapter.get('/client/api-json', (_req, res) => {
    httpAdapter.reply(res, clientDocument);
  });

  app.useStaticAssets(join(__dirname, '..', 'docs'), { prefix: '/docs' });

  const { apiReference } = await loadScalarApiReference();

  // Scalar API Reference - Interactive docs with "Try it" feature
  // Admin docs: http://localhost:3005/admin/docs
  app.use(
    '/admin/docs',
    apiReference({
      theme: 'purple',
      spec: {
        content: adminDocument,
      },
    }),
  );

  // Client docs: http://localhost:3005/client/docs
  app.use(
    '/client/docs',
    apiReference({
      theme: 'blue',
      spec: {
        content: clientDocument,
      },
    }),
  );

  app.enableCors({
    origin: ['https://localhost:5174', 'https://localhost:5173', 'https://dynamic-dragon-7ee9d5.netlify.app', 'https://subrosahubclient.netlify.app'], // Allow multiple origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const PORT = process.env.PORT || 3005;
  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
}

bootstrap();

async function loadScalarApiReference(): Promise<typeof import('@scalar/nestjs-api-reference')> {
  // Load ESM-only scalar package from a CJS build without hitting the CJS entrypoint.
  const loader = new Function('return import("@scalar/nestjs-api-reference")') as () => Promise<
    typeof import('@scalar/nestjs-api-reference')
  >;
  return loader();
}
