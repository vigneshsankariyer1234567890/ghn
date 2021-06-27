import { Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User";
import { Post } from "./Post";
import { iLike } from "./iLike";

// m to n
// many to many
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts

@Entity()
export class Like extends iLike {

  @ManyToOne(() => User, (user) => user.likes,{
    onDelete: "CASCADE",
  })
  user: User;

  @PrimaryColumn()
  postId!: number;

  @ManyToOne(() => Post, (post) => post.likes,{
    onDelete: "CASCADE",
  })
  post: Post;
  
}