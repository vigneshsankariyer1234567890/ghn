import { Field, ObjectType, registerEnumType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Event } from "./Event";
import { User } from "./User";
import { Userrole } from "./Userrole";

export enum AdminApproval {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

registerEnumType(AdminApproval, {
  name: "AdminApproval",
});

@ObjectType()
@Entity()
export class Eventvolunteer extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, (event) => event.eventVolunteers)
  event: Event;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.volunteerActivities)
  user: User;

  @Column({
    type: "enum",
    enum: AdminApproval,
    default: AdminApproval.PENDING,
  })
  adminapproval: AdminApproval;

  @Column()
  userroleId: number;

  @ManyToOne(() => Userrole, (ur) => ur.eventVolunteer)
  userrole: Userrole;

  @Column({ type: "boolean", default: true })
  auditstat!: boolean;

  @Column({ type: "boolean", default: false })
  volunteeringCompleted!: boolean;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
