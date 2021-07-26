import { FieldResolver, Resolver, Root } from "type-graphql";
import { Comment } from "../entities/Comment";
import { User } from "../entities/User";
import { createCommentDPLoader } from "../utils/dataloaders/createCommentDPLoader";
import { createCommentPCLoader } from "../utils/dataloaders/createCommentPCLoader";

@Resolver(Comment)
export class CommentResolver {

    static dploader = createCommentDPLoader();
    static parentCommentLoader = createCommentPCLoader();

    @FieldResolver(() => User, {nullable: true})
    async author(
        @Root() comment: Comment
    ): Promise<User | undefined> {
        return await CommentResolver.dploader.load(comment.id);
    }

    @FieldResolver(() => Comment, {nullable: true})
    async parentComment(
        @Root() comment: Comment
    ): Promise<Comment | undefined> {
        return await CommentResolver.parentCommentLoader.load(comment.id);
    }
}