import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Eventvolunteer } from "./Eventvolunteer";
import { Task } from "./Task";

@ObjectType()
@Entity()
export class Taskvolunteer extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    taskId: number;

    @ManyToOne(() => Task, task => task.taskvolunteers)
    task: Task;

    @Column()
    eventvolunteerId: number;

    @ManyToOne(() => Eventvolunteer, ev => ev.taskvolunteers)
    eventvolunteer: Eventvolunteer;

    @Column({type: "boolean", default:true})
    auditstat!: boolean



}