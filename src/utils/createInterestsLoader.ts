// create new loader for each field to optimise

import DataLoader from "dataloader";
import { Category } from "../entities/Category";
// import { UserCategory } from "../entities/UserCategory";



// keys: [some array of objects]
// e.g. [{postid: 23, userId: 1}, {postid: 25, userId: 4}]
// return: [some array of usercategory objects]
// e.g. [{}, {}, {}, {}]
export const createCategoryLoader = () => 
    new DataLoader<number, Category >(async catids => {
        // const usercategories = await UserCategory.findByIds(userId as number[]);
        // const catids = usercategories.map(uc => uc.categoryId);
        const categories = await Category.findByIds( catids as number[]);
        const categoryIdToCategory: Record<number, Category> = {};
        categories.forEach(cat => {
            categoryIdToCategory[cat.id] = cat;
        })

        return catids.map( (catId) => categoryIdToCategory[catId]);

    });