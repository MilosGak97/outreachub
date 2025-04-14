import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ObjectRelatedModule } from './object-related/object-related.module';
import { TenantMiddleware } from './multi-tenant-setup/tenant.middleware';

@Module({
  imports: [AuthModule, CommonModule, ObjectRelatedModule],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes(
        // You can scope this to only authenticated routes/controllers
        { path: 'client/*', method: RequestMethod.ALL },
      );
  }
}
