import { Field, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BaseEntity } from "typeorm/repository/BaseEntity";
import { Charity } from "./Charity";


@ObjectType()
@Entity()
export class Charityprofile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column("text")
  about: string;

  @Field(() => String, {nullable: true})
  @Column({type: 'text',nullable: true})
  displayPicture?: string;

  @Field(() => String, {nullable: true})
  @Column({type: 'text',nullable: true})
  links?: string;

  @Field(() => String, {nullable: true})
  @Column({type: "text", nullable: true})
  contactNumber?: string;

  @Field(() => String, {nullable: true})
  @Column({type: 'text', nullable: true})
  email?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({unique: true})
  charityId!: number;

  @ManyToOne(() => Charity, charity => charity.profile)
  charity: Charity;
}