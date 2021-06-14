import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Charitycategory } from "./Charitycategory";
import { Charityrolelink } from "./Charityrolelink";
import { User } from "./User";
//import { Category } from "./Category";

@ObjectType()
@Entity()
export class Charity extends BaseEntity {

  
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  name!: string;

  @Field()
  @Column({ unique: true })
  uen!: string;

  @Field()
  @Column()
  physicalAddress!: string;

  @Column()
  charitycreatorId: number;

  @Field(() => User)
  @ManyToOne(() => User, user => user.charitycreator)
  charitycreator: User;

  @Field()
  @Column()
  categoryId: number;

  // @Field(() => Category)
  // @ManyToOne(() => Category, cat => cat.charities)
  // category: Category;

  @OneToMany(() => Charityrolelink, crl => crl.charity)
  charityRoleLinks: Charityrolelink[]

  @OneToMany(() => Charitycategory, cc => cc.charity)
  charitycategories: Charitycategory[]


  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  udpatedAt: Date;

  
}