import { Field, ObjectType, registerEnumType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, Check, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

export enum FriendRequestStatus {
    USER1_REQ = "user1_req",
    USER2_REQ = "user2_req",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    BLOCKED_USER1 = "blocked_user1",
    BLOCKED_USER2 = "blocked_user2"
}

registerEnumType(FriendRequestStatus, {
    name: "FriendRequestStatus"
});

@ObjectType()
@Entity()
@Check(`"user1Id" < "user2Id"`) // allows for unique 
export class Userfriend extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user1Id!: number;

  @ManyToOne(() => User, (user) => user.u1)
  user1: User;

  @Column()
  user2Id!: number;

  @ManyToOne(() => User, (user) => user.u2)
  user2: User;

  @Column({
    type: "enum",
    enum: FriendRequestStatus,
    default: FriendRequestStatus.ACCEPTED
  })
  friendreqstatus: FriendRequestStatus

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}