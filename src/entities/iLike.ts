import { BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm";

export abstract class iLike extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number

    @Column({type: "boolean", default:true})
    auditstat!: boolean;

}