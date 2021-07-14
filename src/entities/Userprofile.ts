import { Field, ObjectType, registerEnumType } from "type-graphql";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BaseEntity } from "typeorm/repository/BaseEntity";
import { User } from "./User";

export enum Genders {
    MALE = "male",
    FEMALE = "female",
    NONBINARY = "non-binary/gender-queer",
    WITHHELD = "withheld"
}

registerEnumType(Genders, {
    name: "Genders"
});

@ObjectType()
@Entity()
export class Userprofile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column("text")
  about: string;

  @Field(() => Genders)
  @Column({
    type: "enum",
    enum: Genders,
    default: Genders.WITHHELD
  })
  gender: Genders;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column()
  displayPicture: string;

  @Field()
  @Column()
  telegramHandle: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;


  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
