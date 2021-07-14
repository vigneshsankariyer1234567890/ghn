import { Field, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BaseEntity } from "typeorm/repository/BaseEntity";
import { Charity } from "./Charity";


@ObjectType()
@Entity()
export class Charityprofile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column("text")
  about: string;

  @Field()
  @Column()
  displayPicture: string;

  @Field()
  @Column()
  links: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Charity)
  @JoinColumn()
  charity: Charity;
}