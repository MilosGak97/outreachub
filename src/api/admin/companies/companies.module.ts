import { Module } from '@nestjs/common'; 
import { CompanyRepository } from '../../repositories/postgres/company.repository';
import { UserRepository } from '../../repositories/postgres/users.repository';  
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/api/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; 
//import { Subscription } from 'src/api/data/property-listings/entities/subscription.entity';
import { EmailService } from 'src/api/email/email.service';
import { Company } from 'src/api/entities/company.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesUsersController } from './users/users.controller';
import { CompaniesService } from './companies.service';
import { CompaniesUsersService } from './users/users.service';

@Module({
  imports:
  [
    TypeOrmModule.forFeature([User, Company]),
    JwtModule.register({secret: 'topSecret51'}),
    PassportModule.register({defaultStrategy: 'jwt'})
  ] ,
  controllers: [CompaniesController, CompaniesUsersController],
  providers: [
    CompaniesService,
    CompaniesUsersService,
    CompanyRepository,
    UserRepository,
    EmailService,
  ],
})
export class CompaniesModule {}
