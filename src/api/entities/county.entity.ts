import { ApiProperty } from "@nestjs/swagger";
import {  IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"; 
import { CountyStatus } from "../enums/common/county-status.enum";
import { State } from "./state.entity";

@Entity('counties')
export class County{
    @ApiProperty({required:true})
    @PrimaryGeneratedColumn('uuid')
    id:string

    @ApiProperty({required:true})
    @IsNotEmpty()
    @IsString()
    @Column({nullable:false})
    name:string

    @ApiProperty({required: false}) // set this to true later
    //@IsNotEmpty()
    @IsEnum(CountyStatus)
    @Column()
    status: CountyStatus
    

    @ApiProperty({required:true})
    @IsNotEmpty()
    @ManyToOne(() => State, (state) => state.counties)
    state?: State
 

    @ApiProperty({required: false})
    @IsString()
    @IsOptional()
    @Column({type: 'json', nullable:true})
    zipcodes?: string[];
 
    // Automatically handles 'created at' timestamp
    @ApiProperty()
    @CreateDateColumn()
    created_at: Date;
    
    // Automatically handles 'updated at' timestamp, updated whenever entity is modified
    @ApiProperty()
    @UpdateDateColumn()
    updated_at: Date;
}