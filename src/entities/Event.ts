import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Charity } from "./Charity";
import { Eventlike } from "./Eventlike";
import { Eventvolunteer } from "./Eventvolunteer";
import { Posteventlink } from "./Posteventlink";
import { Task } from "./Task";
import { User } from "./User";

@ObjectType()
@Entity()
export class Event extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    @Field()
    @Column("text")
    description!: string;

    @Field(() => String)
    @Column({type: "timestamp"})
    dateStart!: Date;

    @Field(() => String)
    @Column({type: "timestamp"})
    dateEnd!: Date

    @Field(() => String)
    @Column({type: "text", default: ""})
    venue!: String

    @Column()
    charityId: number;

    @Field(() => Charity)
    @ManyToOne(() => Charity, (charity) => charity.charityevents)
    charity: Charity;

    @Column()
    creatorId: number;

    @Field(() => User)
    @ManyToOne(() => User, user => user.createdevents)
    creator: User

    @Field()
    @Column({ type: "int", default: 0 })
    likeNumber!: number;

    @OneToMany(() => Posteventlink, pel => pel.event)
    posteventlinks: Posteventlink[];

    @OneToMany(() => Eventvolunteer, ev => ev.event)
    eventVolunteers: Eventvolunteer[];

    @OneToMany(() => Task, t => t.event)
    tasks: Task[];

    @OneToMany(() => Eventlike, ev => ev.event)
    likes: Eventlike[];

    @Field(() => Boolean)
    @Column({type: "boolean", default:false})
    completed!: boolean

    @Column({type: "boolean", default:true})
    auditstat!: boolean

    // @Field(() => String, {nullable: true})
    @Column({type: "text", nullable: true})
    telegramGroupId?: string

    // @Field(() => String, {nullable: true})
    @Column({type: "text", nullable: true})
    telegramGroupHash?: string

    // @Field(() => String, {nullable: true})
    @Column({type: "timestamptz", nullable: true})
    telegramGroupUpdatedDate?: Date;

    @Field(() => String, {nullable: true})
    @Column({type: "text", nullable: true})
    imageUrl?: string;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;



}