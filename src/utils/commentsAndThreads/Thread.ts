import { Field, ObjectType } from "type-graphql";
import { CommentTree } from "./CommentTree";

@ObjectType()
export class Thread {
    @Field()
    postId!: number

    @Field(() => [CommentTree])
    commentTreeList: CommentTree[]

    constructor(postId: number, commentTreeList: CommentTree[]) {
        this.postId = postId;
        this.commentTreeList = commentTreeList;
    }

}