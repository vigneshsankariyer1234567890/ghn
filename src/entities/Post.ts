import { ObjectType, Field, Int } from "type-graphql";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Like } from "./Like";
import { Posteventlink } from "./Posteventlink";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  // @Field()
  // @Column()
  // title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int", default: 0 })
  likeNumber!: number;

  @Field(() => Int, { nullable: true })
  voteStatus: number | null; // 1 or -1 or null

  @Field()
  @Column()
  creatorId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: "CASCADE",
  })
  creator: User;

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @OneToMany(() => Posteventlink, pel => pel.post)
  posteventlinks: Posteventlink[]

  @Field(() => Boolean)
  @Column({type: "boolean", default:true})
  auditstat!: boolean;

  @Field(() => Boolean)
  @Column({type: "boolean", default:false})
  isEvent!: boolean;

  @Field(() => String, {nullable: true})
  @Column({type: "text", nullable: true})
  imageUrl?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}