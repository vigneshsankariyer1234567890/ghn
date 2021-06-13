import { Resolver, Query, UseMiddleware, Arg, Ctx, Mutation, InputType, Field, ObjectType } from "type-graphql";
import { getConnection } from "typeorm";
import { Category } from "../entities/Category";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { FieldError } from "./user";
import { Usercategory } from "../entities/Usercategory";

@InputType()
class CategoryInput {
  @Field(() => [Number])
  categories: number[];
}

@ObjectType()
class CategoryResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
  
    @Field(() => Boolean, { nullable: true })
    success!: boolean;
}

@Resolver()
export class CategoryResolver {

    @Query(() => [Category])
    async interests(): Promise<Category[]> {
        return Category.find({
            order: {
                name: "ASC"
            }
        })
    }

    @UseMiddleware(isAuth)
    @Mutation(() => CategoryResponse)
    async updateUserCategories(
        @Arg('categories', () => CategoryInput) categories: CategoryInput,
        @Ctx() {req}: MyContext
    ): Promise<CategoryResponse> {

        const catarr = categories.categories;

        if (catarr.length < 1) {
            return {
                errors: [
                    {  
                        field: "Interests", 
                        message: "Please select at least one interest."  
                    }],
                success: false
            };
        }

        const { userId } = req.session;

        const uc = await Usercategory.find({where: {userId: userId, auditstat:true}});

        if (uc.length>0) {
            // updates to false
            await getConnection().transaction( async tm => {
            await tm.query(`
                update usercategory
                set auditstat = false
                where "userId" = $1
            `, [userId])
            });

        }
            
        // insert back 
        catarr.forEach(async category => {
            await getConnection().transaction( async tm => {
                await tm.query(`
                    insert into usercategory ("userId", "categoryId")
                    values ($1, $2)
                `, [userId, category])
            })
        });
        
        return {success: true};
    }
}