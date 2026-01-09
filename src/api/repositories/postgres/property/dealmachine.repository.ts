import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Dealmachine } from '../../../entities/property/dealmachine.entity';

@Injectable()
export class DealmachineRepository extends Repository<Dealmachine> {
  constructor(private readonly dataSource: DataSource) {
    super(Dealmachine, dataSource.createEntityManager());
  }
}
