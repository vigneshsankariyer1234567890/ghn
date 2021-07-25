import { Field, ObjectType, registerEnumType } from "type-graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
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

  @Field(() => Genders, {nullable: true})
  @Column({
    type: "enum",
    enum: Genders,
    // default: Genders.WITHHELD,
    nullable: true
  })
  gender?: Genders;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field(() => String, {nullable: true})
  @Column({type: 'text',nullable: true})
  displayPicture?: string;

  @Field(() => String, {nullable: true})
  @Column({type: 'text',nullable: true})
  telegramHandle?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({unique: true})
  userId!: number;

  @ManyToOne(() => User, user => user.profile)
  user: User;
}
