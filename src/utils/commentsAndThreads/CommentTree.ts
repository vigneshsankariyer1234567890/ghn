import { Field, InputType, Int} from "type-graphql";
import { Comment } from "../../entities/Comment";

// CommentTree is a recursive data structure
// that may either have children = null or children = CommentTree[]

// @ObjectType()
export class CommentTree {
//   @Field(() => Comment)
  comment: Comment;

//   @Field()
  level?: number;

//   @Field(() => [CommentTree], { nullable: true })
  children?: CommentTree[];

  constructor(comment: Comment) {
    this.comment = comment;
  }

  public setChildren(children: CommentTree[]) {
    this.children = children;
  }

  public setLevel(level: number) {
    this.level = level;
  }

  public static buildCommentTree(
    commentArr: Comment[],
    commentTree: CommentTree
  ): CommentTree {
    // get the id of the comment of the CommentTree
    const rootId = commentTree.comment.id;

    // check if there are any comments which have current comment as parent
    const filteredComments = commentArr.filter((com) =>
      !com.parentId ? false : rootId === com.parentId
    );

    // if not, we have reached the bottom level. set level = 0 and return CommentTree
    if (filteredComments.length === 0) {
      commentTree.setLevel(0);
      return commentTree;
    }

    // else, we need to get our children. For each of the filtered comments, build a CommentTree with 
    // that comment at the root.
    const children = filteredComments.map((co) =>
      CommentTree.buildCommentTree(commentArr, new CommentTree(co))
    );

    // In order to set the height of the tree, need to get the max level of all the CommentTrees.
    const maxLevel = children.reduce((a,b) => !(b.level) ? a : b.level > a ? b.level : a, 0);

    // since we know the max height of the tree, height our CommentTree = maxLevel + 1
    commentTree.setLevel(maxLevel + 1);

    // Set children of the CommentTree
    commentTree.setChildren(children);

    // Return the CommentTree
    return commentTree;
  }
}

@InputType()
export class CommentInput {
  @Field()
  text!: string;

  @Field(() => Int, { nullable: true })
  parentId?: number;
}
