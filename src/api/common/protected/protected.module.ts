import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtectedValue } from '../../entities/protected/protected-value.entity';
import { ProtectedValueRepository } from '../../repositories/postgres/protected/protected-value.repository';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProtectedValue]),
    EncryptionModule,
  ],
  providers: [ProtectedValueRepository],
  exports: [ProtectedValueRepository],
})
export class ProtectedModule {}
