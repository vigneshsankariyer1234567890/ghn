import { Field, Int, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Comment extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column()
  authorId!: number

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: "CASCADE",
  })
  author!: User;

  @Field()
  @Column()
  postId!: number

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: "CASCADE",
  })
  post!: Post;

  @Field(() => Int, {nullable: true})
  @Column({type: "int", nullable: true})
  parentId?: number

  @Field()
  @Column()
  rootId: number

  @Field(() => Boolean)
  @Column({type: "boolean", default:true})
  auditstat!: boolean;

  @Field()
  @Column()
  level!: number

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}
