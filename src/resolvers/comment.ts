import { FieldResolver, Resolver, Root } from "type-graphql";
import { Comment } from "../entities/Comment";
import { createCommentDPLoader } from "../utils/dataloaders/createCommentDPLoader";

@Resolver(Comment)
export class CommentResolver {

    static dploader = createCommentDPLoader();

    @FieldResolver(() => String, {nullable: true})
    async displayPicture(
        @Root() comment: Comment
    ): Promise<string | undefined> {
        return await CommentResolver.dploader.load(comment.id);
    }
}