import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Event } from "./Event";
import { Taskvolunteer } from "./Taskvolunteer";

enum TaskCompletionStatus {
    CLOSED = "completed",
    NEW = "new",
    ACTIVE = "active",
    RESOLVED = "resolved"
}

@ObjectType()
@Entity()
export class Task extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    eventId: number;

    @ManyToOne(() => Event, event => event.tasks, {
        onDelete: "CASCADE"
    })
    event: Event;

    @Field()
    @Column("text")
    description!: string;

    @Field(() => String)
    @Column({type: "timestamp"})
    deadline!: Date;

    @Column({
        type: "enum",
        enum: TaskCompletionStatus,
        default: TaskCompletionStatus.NEW
    })
    completionstatus: TaskCompletionStatus

    @OneToMany(() => Taskvolunteer, tv => tv.task)
    taskvolunteers: Taskvolunteer[]

}
