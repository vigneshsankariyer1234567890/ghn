import { Entity, BaseEntity, ManyToOne, PrimaryColumn, Column, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Post } from "./Post";

// m to n
// many to many
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts

@Entity()
export class Like extends BaseEntity {

  
  @PrimaryGeneratedColumn()
  id!: number

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.likes)
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.likes, {
    onDelete: "CASCADE",
  })
  post: Post;

  @Column({type: "boolean", default:true})
  auditstat!: boolean;
  
}