import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
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

    @ManyToOne(() => Event, event => event.posteventlinks, {
        onDelete: "CASCADE"
    })
    event: Event

    @Column()
    postId: number;

    @ManyToOne(() => Post, post => post.posteventlinks, {
        onDelete: "CASCADE"
    })
    post: Post;

    // if event is deleted => post also deleted, else only post deleted

}