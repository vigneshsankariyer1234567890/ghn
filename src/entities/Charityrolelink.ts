import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Charity } from "./Charity";
import { User } from "./User";
import { Userrole } from "./Userrole";

@ObjectType()
@Entity()
export class Charityrolelink extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number

    @ManyToOne(() => User, (user) => user.charityRoleLinks)
    user: User;

    @Column()
    userroleId!: number

    @ManyToOne(() => Userrole, (userrole) => userrole.charityRoleLinks )
    userrole: Userrole

    @Column()
    charityId!: number

    @ManyToOne(() => Charity, (charity) => charity.charityRoleLinks )
    charity!: Charity

    @Column({type: "boolean", default:true})
    auditstat!: boolean;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    udpatedAt: Date;

}