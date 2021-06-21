import { ObjectType } from "type-graphql";
import { BaseEntity, Entity, ManyToOne, Column, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { User } from "./User";

// m to n, many to many
// user <-> posts (user can like many posts, posts can be liked by many people)
// user -> join table <- posts

@ObjectType()
@Entity()
export class Usercategory extends BaseEntity {

  
  @PrimaryGeneratedColumn()
  id!: number
  
  @Column()
  userId: number;
  
  @ManyToOne(() => User, user => user.usercategories, {
    onDelete: "CASCADE",
  })
  user: User;
 
  @Column()
  categoryId: number;
  
  @ManyToOne(() => Category, cat => cat.categories, {
    onDelete: "CASCADE",
  })
  category: Category;
 
  @Column({type: "boolean", default:true})
  auditstat!: boolean;

}