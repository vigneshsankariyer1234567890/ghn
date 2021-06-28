import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

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
    userId: number;

    @ManyToOne(() => User, u => u.taskactivities)
    user: User;

    @Column({type: "boolean", default:true})
    auditstat!: boolean



}