import { ObjectType } from "type-graphql";
import { BaseEntity, Entity, ManyToOne, Column, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { Charity } from "./Charity";

// m to n, many to many
// user <-> posts (user can like many posts, posts can be liked by many people)
// user -> join table <- posts

@ObjectType()
@Entity()
export class Charitycategory extends BaseEntity {

  
  @PrimaryGeneratedColumn()
  id!: number
  
  @Column()
  charityId: number;
  
  @ManyToOne(() => Charity, charity => charity.charitycategories)
  charity: Charity;
 
  @Column()
  categoryId: number;
  
  @ManyToOne(() => Category, cat => cat.categories)
  category: Category;
 
  @Column({type: "boolean", default:true})
  auditstat!: boolean;

}