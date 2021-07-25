import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Charity } from "./Charity";
import { User } from "./User";

@ObjectType()
@Entity()
export class Charityfollow extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  charityId!: number;

  @ManyToOne(() => Charity, (charity) => charity.charityFollowers)
  charity!: Charity;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.followedCharities)
  user: User;

  @Column({ type: "boolean", default: true })
  auditstat!: boolean;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
