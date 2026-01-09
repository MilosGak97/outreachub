import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserExtrasAccess } from '../../../entities/property/user-extras-access.entity';

@Injectable()
export class UserExtrasAccessRepository extends Repository<UserExtrasAccess> {
  constructor(private readonly dataSource: DataSource) {
    super(UserExtrasAccess, dataSource.createEntityManager());
  }
}
