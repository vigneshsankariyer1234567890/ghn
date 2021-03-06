import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Post } from "./Post";
import { Like } from "./Like";
import { Usercategory } from "./Usercategory";
import { Charity } from "./Charity";
import { Charityrolelink } from "./Charityrolelink"
import { Eventvolunteer } from "./Eventvolunteer";
import { Eventlike } from "./Eventlike";
import { Event } from "./Event";
import { Charityfollow } from "./Charityfollow";
import { Taskvolunteer } from "./Taskvolunteer";
import { Userfriend } from "./Userfriend";
import { Userprofile } from "./Userprofile";
import { Comment } from "./Comment";

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

  @OneToMany(() => Taskvolunteer, tv => tv.user)
  taskactivities: Taskvolunteer[];

  @OneToMany(() => Event, ev => ev.creator)
  createdevents: Event[];

  @OneToMany(() => Charityfollow, cf => cf.user)
  followedCharities: Charityfollow[];

  @OneToMany(() => Userfriend, uf => uf.user1)
  u1: Userfriend[];

  @OneToMany(() => Userfriend, uf => uf.user2)
  u2: Userfriend[];

  @OneToOne(() => Userprofile, userprof => userprof.user)
  profile: Userprofile

  @OneToOne(() => Comment, comm => comm.author)
  comments: Comment

  @Field()
  @Column({type: "boolean", default:false})
  verified: boolean

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}