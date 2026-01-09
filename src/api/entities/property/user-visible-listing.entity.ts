import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {ApiProperty} from "@nestjs/swagger";
import {User} from "../user.entity";
import {PropertyListing} from "./property-listing.entity";

@Index('idx_uvl_pl', ['propertyListing'])
@Entity('user-visible-listings')
export class UserVisibleListing{
    @ApiProperty({required: true})
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({required: true})
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({name: 'user_id'})
    user: User;

    @ApiProperty({required: true})
    @ManyToOne(() => PropertyListing, { onDelete: 'CASCADE' })
    @JoinColumn({name: 'property_listing_id'})
    propertyListing: PropertyListing;



  @ApiProperty({required: false})
  @CreateDateColumn({name: 'created_at'})
  createdAt?: Date;

  @ApiProperty({required: false})
  @UpdateDateColumn({name: 'updated_at'})
  updatedAt?: Date;
}
