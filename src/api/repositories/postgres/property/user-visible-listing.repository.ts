import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserVisibleListing } from '../../../entities/property/user-visible-listing.entity';

@Injectable()
export class UserVisibleListingRepository extends Repository<UserVisibleListing> {
  constructor(private readonly dataSource: DataSource) {
    super(UserVisibleListing, dataSource.createEntityManager());
  }
}
