import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Event } from "./Event";
import { Taskvolunteer } from "./Taskvolunteer";
import { User } from "./User";
import { Userrole } from "./Userrole";

export enum AdminApproval {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}

@ObjectType()
@Entity()
export class Eventvolunteer extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    eventId: number;

    @ManyToOne(() => Event, event => event.eventVolunteers)
    event: Event;

    @Column()
    userId: number;

    @ManyToOne(() => User, user => user.volunteerActivities)
    user: User;

    @Column({
        type: "enum",
        enum: AdminApproval,
        default: AdminApproval.PENDING
    })
    adminapproval: AdminApproval

    @Column()
    userroleId: number

    @ManyToOne(() => Userrole, ur => ur.eventVolunteer)
    userrole: Userrole

    @OneToMany(() => Taskvolunteer, tv => tv.eventvolunteer)
    taskvolunteers: Taskvolunteer[];

    @Column({type: "boolean", default:true})
    auditstat!: boolean

    @Column({type: "boolean", default:false})
    volunteeringCompleted!: boolean
}