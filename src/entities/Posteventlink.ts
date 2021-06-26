import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Charity } from "./Charity";
import { Event } from "./Event";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Posteventlink extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    eventId: number;

    @ManyToOne(() => Event, event => event.posteventlinks)
    event: Event

    @Field()
    @Column()
    eventName!: string;

    @Column()
    charityId: number;

    @Field(() => Charity)
    @ManyToOne(() => Charity, (charity) => charity.charityeventposts)
    charity: Charity;

    @Column()
    postId: number;

    @ManyToOne(() => Post, post => post.posteventlinks)
    post: Post;

    @Column({type: "boolean", default:true})
    auditstat!: boolean

    // if event is deleted => post also deleted, else only post deleted

}