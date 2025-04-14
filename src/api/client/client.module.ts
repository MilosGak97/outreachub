import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ObjectRelatedModule } from './object-related/object-related.module';

@Module({
  imports: [AuthModule, CommonModule, ObjectRelatedModule]
})
export class ClientModule {
    



}
