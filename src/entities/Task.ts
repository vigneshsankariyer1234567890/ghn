import { ObjectType, Field, registerEnumType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Event } from "./Event";
import { Taskvolunteer } from "./Taskvolunteer";

export enum TaskCompletionStatus {
    CLOSED = "completed",
    NEW = "new",
    ACTIVE = "active",
    RESOLVED = "resolved"
};

registerEnumType(TaskCompletionStatus, {
    name: "TaskCompletionStatus"
});

@ObjectType()
@Entity()
export class Task extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    eventId: number;

    @ManyToOne(() => Event, event => event.tasks)
    event: Event;

    @Field()
    @Column("text")
    description!: string;

    @Field(() => String)
    @Column({type: "timestamp"})
    deadline!: Date;

    @Column({type: "boolean", default:true})
    auditstat!: boolean

    @Column({
        type: "enum",
        enum: TaskCompletionStatus,
        default: TaskCompletionStatus.NEW
    })
    completionstatus: TaskCompletionStatus

    @OneToMany(() => Taskvolunteer, tv => tv.task)
    taskvolunteers: Taskvolunteer[]

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

}
