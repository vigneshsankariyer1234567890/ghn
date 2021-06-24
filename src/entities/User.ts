import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { Post } from "./Post";
import { Like } from "./Like";
import { Usercategory } from "./Usercategory";
import { Charity } from "./Charity";
import { Charityrolelink } from "./Charityrolelink"
import { Eventvolunteer } from "./Eventvolunteer";
import { Eventlike } from "./Eventlike";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Eventlike, (ev) => ev.user)
  eventlikes: Eventlike[];

  @OneToMany(() => Usercategory, (uc) => uc.user)
  usercategories: Usercategory[];

  @OneToMany(() => Charity, char => char.charitycreator)
  charitycreator: Charity[];

  @OneToMany(() => Charityrolelink, crl => crl.user)
  charityRoleLinks: Charityrolelink[];

  @OneToMany(() => Eventvolunteer, ev => ev.user)
  volunteerActivities: Eventvolunteer[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}