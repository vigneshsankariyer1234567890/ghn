import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "./User";
import { Event } from "./Event";
import { iLike } from "./iLike";

// m to n
// many to many
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts

@Entity()
export class Eventlike extends iLike {

  @ManyToOne(() => User, (user) => user.eventlikes, {
    onDelete: "CASCADE",
  })
  user: User;

  @Column()
  eventId!: number;

  @ManyToOne(() => Event, (event) => event.likes, {
    onDelete: "CASCADE",
  })
  event: Event;
  
}