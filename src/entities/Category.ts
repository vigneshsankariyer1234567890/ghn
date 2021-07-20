import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn  } from "typeorm";
import { Charitycategory } from "./Charitycategory";
//import { Charity } from "./Charity";
import { Usercategory } from "./Usercategory";


@ObjectType()
@Entity()
export class Category extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  name!: string;

  // @OneToMany(() => Charity, charity => charity.category)
  // charities: Charity[]

  @OneToMany(() => Usercategory, usercat => usercat.category)
  categories: Usercategory[]

  @OneToMany(() => Charitycategory, charitycat => charitycat.charity)
  charityCategories: Charitycategory[]

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({type: "boolean", default:true})
  auditstat!: boolean
}