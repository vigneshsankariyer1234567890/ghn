import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Charityrolelink } from "./Charityrolelink";
import { Eventvolunteer } from "./Eventvolunteer";

@ObjectType()
@Entity()
export class Userrole extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number

    @Field()
    @Column()
    roleName!: string

    @OneToMany(() => Charityrolelink, crl => crl.userrole)
    charityRoleLinks: Charityrolelink[];

    @OneToMany(() => Eventvolunteer, ev => ev.userrole)
    eventVolunteer: Eventvolunteer[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

}