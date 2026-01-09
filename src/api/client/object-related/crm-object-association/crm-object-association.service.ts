import { Injectable } from '@nestjs/common';
import {
  CrmObjectAssociationRepository
} from '../../../repositories/postgres/object/crm-object-association.repository';

@Injectable()
export class CrmObjectAssociationService {
  constructor(
    private readonly crmObjectAssociationRepository: CrmObjectAssociationRepository
  ) {
  }
}
