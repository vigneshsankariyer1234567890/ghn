import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Charitycategory } from "./Charitycategory";
import { Charityrolelink } from "./Charityrolelink";
import { Event } from "./Event";
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
  @ManyToOne(() => User, user => user.charitycreator, {
    onDelete: "CASCADE",
  })
  charitycreator: User;

  @OneToMany(() => Charityrolelink, crl => crl.charity)
  charityRoleLinks: Charityrolelink[]

  @OneToMany(() => Charitycategory, cc => cc.charity)
  charitycategories: Charitycategory[]

  @OneToMany(() => Event, event => event.charity)
  charityevents: Event[]


  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  udpatedAt: Date;

  
}