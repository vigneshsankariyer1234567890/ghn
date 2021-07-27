import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";
import { Comment } from "../entities/Comment";
import { User } from "../entities/User";
import { MyContext } from "../types";


@Resolver(Comment)
export class CommentResolver {

    @FieldResolver(() => User, {nullable: true})
    async author(
        @Root() comment: Comment,
        @Ctx() {commentDpLoader}: MyContext
    ): Promise<User | undefined> {
        return await commentDpLoader.load(comment.id);
    }

    @FieldResolver(() => Comment, {nullable: true})
    async parentComment(
        @Root() comment: Comment,
        @Ctx() {commentPCLoader}: MyContext
    ): Promise<Comment | undefined> {
        return await commentPCLoader.load(comment.id);
    }
}