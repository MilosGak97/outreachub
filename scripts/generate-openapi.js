"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
async function generateOpenApiSpecs() {
    const { AppModule } = await Promise.resolve().then(() => require('../src/app.module'));
    const { AdminModule } = await Promise.resolve().then(() => require('../src/api/admin/admin.module'));
    const { ClientModule } = await Promise.resolve().then(() => require('../src/api/client/client.module'));
    const { ObjectRelatedModule } = await Promise.resolve().then(() => require('../src/api/client/object-related/object-related.module'));
    console.log('Creating NestJS application...');
    const app = await core_1.NestFactory.create(AppModule, {
        logger: ['error', 'warn'],
    });
    const adminConfig = new swagger_1.DocumentBuilder()
        .setTitle('Admin API')
        .setDescription('Admin Application API')
        .setVersion('1.0')
        .build();
    const optionAdmin = {
        include: [AdminModule],
        deepScanRoutes: true,
    };
    const adminDocument = swagger_1.SwaggerModule.createDocument(app, adminConfig, optionAdmin);
    const clientConfig = new swagger_1.DocumentBuilder()
        .setTitle('Client API')
        .setDescription('Client Application API')
        .setVersion('1.0')
        .build();
    const optionClient = {
        include: [ClientModule, ObjectRelatedModule],
        deepScanRoutes: true,
    };
    const clientDocument = swagger_1.SwaggerModule.createDocument(app, clientConfig, optionClient);
    const docsDir = path.join(__dirname, '..', 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'openapi.admin.json'), JSON.stringify(adminDocument, null, 2));
    console.log('✓ Generated docs/openapi.admin.json');
    fs.writeFileSync(path.join(docsDir, 'openapi.client.json'), JSON.stringify(clientDocument, null, 2));
    console.log('✓ Generated docs/openapi.client.json');
    await app.close();
    console.log('Done!');
    process.exit(0);
}
generateOpenApiSpecs().catch((err) => {
    console.error('Failed to generate OpenAPI specs:', err);
    process.exit(1);
});
//# sourceMappingURL=generate-openapi.js.map