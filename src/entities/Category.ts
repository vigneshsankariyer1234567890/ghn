import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn  } from "typeorm";
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

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  udpatedAt: Date;
}