import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Charityrolelink } from "./Charityrolelink";

@ObjectType()
@Entity()
export class Userrole extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    roleName!: string

    @OneToMany(() => Charityrolelink, crl => crl.userrole)
    charityRoleLinks: Charityrolelink[]

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    udpatedAt: Date;

}