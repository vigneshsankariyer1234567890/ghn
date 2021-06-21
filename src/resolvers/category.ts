import { Resolver, Query, UseMiddleware, Arg, Ctx, Mutation, InputType, Field, ObjectType } from "type-graphql";
import { getConnection } from "typeorm";
import { Category } from "../entities/Category";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { FieldError } from "./user";
import { Usercategory } from "../entities/Usercategory";
import { Charity } from "../entities/Charity";
import { validateCharityAdmin } from "../utils/validateCharityAdmin";
import { Charitycategory } from "../entities/Charitycategory";

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

    @UseMiddleware(isAuth)
    @Mutation(() => CategoryResponse)
    async updateCharityCategories(
        @Arg('categories', () => CategoryInput) categories: CategoryInput,
        @Arg('uen', () => String) uen:string,
        @Ctx() {req}: MyContext
    ): Promise<CategoryResponse> {
        
        if (!req.session.userId) {
            return {
                errors: [
                    {
                        field: "User",
                        message: "User is not authenticated."
                    }
                ],
                success: false
            }
        }

        const errors = await validateCharityAdmin({uen:uen, userid:req.session.userId});

        if (errors) {
            return {
                errors,
                success: false
            }
        }

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

        const charity = await Charity.findOne({where: {uen:uen}});

        if (!charity) {
            return {
                errors: [
                    {  
                        field: "Charity", 
                        message: "That charity does not exist."  
                    }],
                success: false
            }; 
        }

        const uc = await Charitycategory.find({where: {charityId:charity.id, auditstat:true}});

        if (uc.length>0) {
            // updates to false
            await getConnection().transaction( async tm => {
            await tm.query(`
                update charitycategory
                set auditstat = false
                where "charityId" = $1
            `, [charity.id])
            });

        }
            
        // insert back 
        catarr.forEach(async category => {
            await getConnection().transaction( async tm => {
                await tm.query(`
                    insert into charitycategory ("charityId", "categoryId")
                    values ($1, $2)
                `, [charity.id, category])
            })
        });
        
        return {success: true};
    }
}