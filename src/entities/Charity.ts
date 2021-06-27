import { Field, ObjectType, Int } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Charitycategory } from "./Charitycategory";
import { Charityfollow } from "./Charityfollow";
import { Charityrolelink } from "./Charityrolelink";
import { Event } from "./Event";
import { Posteventlink } from "./Posteventlink";
import { User } from "./User";

@ObjectType()
@Entity()
export class Charity extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  name!: string;

  @Field()
  @Column({ unique: true })
  uen!: string;

  @Field()
  @Column()
  physicalAddress!: string;

  @Field()
  @Column()
  postalcode!: string;

  @Column()
  charitycreatorId!: number;

  @Field(() => User)
  @ManyToOne(() => User, user => user.charitycreator)
  charitycreator: User;

  @OneToMany(() => Charityrolelink, crl => crl.charity)
  charityRoleLinks: Charityrolelink[]

  @OneToMany(() => Charitycategory, cc => cc.charity)
  charitycategories: Charitycategory[]

  @OneToMany(() => Event, event => event.charity)
  charityevents: Event[]

  @OneToMany(() => Posteventlink, pel => pel.charity)
  charityeventposts: Posteventlink[]

  @OneToMany(() => Charityfollow, cf => cf.charity)
  charityFollowers: Charityfollow[]

  @Field()
  @Column({ type: "int", default: 0 })
  followNumber!: number;

  @Field(() => Int, { nullable: true })
  followStatus: number | null; // 1 or -1 or null

  @Column({type: "boolean", default:true})
  auditstat!: boolean

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  udpatedAt: Date;

  
}