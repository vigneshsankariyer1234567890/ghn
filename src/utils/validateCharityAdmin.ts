import { Charity } from "../entities/Charity";
import { Charityrolelink } from "../entities/Charityrolelink";
import { FieldError } from "../resolvers/user";
import { CharityUserInput } from "./CharityUserInput";

export class CharityResponseObject{
    errors?: FieldError[];
    charIdReturned?: number;
    success: boolean;
}

export const validateCharityAdmin = async (options: CharityUserInput): Promise<CharityResponseObject> => {

    if (!(options.uen) || !(options.charityId)) {
        return {
            errors: [{
                field: "Required Parameters",
                message: "Either UEN or charityId must be provided."
            }],
            success: false
        }
    }

    let charid: number;

    if (options.uen) {
        const res = await Charity.findOne({where: {uen: options.uen}});

        if (!res) {
            return {
                errors: [
                    {
                        field: "uen",
                        message: "There is no such charity which corresponds to the UEN provided."
                    }
                ],
                success: false
            }
        }
        charid = res.id;
    } else {

        charid = options.charityId

    }
    
    // const char = (options.uen) 
    //     ? await Charity.findOne({where: {uen: options.uen}})
    //     : await Charity.findOne({where: {id: options.charityId}});

    // if (!char) {
    //     return {
    //         errors: [
    //             {
    //                 field: "uen",
    //                 message: "There is no such charity which corresponds to the UEN provided."
    //             }
    //         ]
    //     }
        
    // }

    // const charid = charity.id;

    const charRoleLinks = await Charityrolelink.find(
        {
            where: 
                {
                    charityId: charid, 
                    userId: options.userid, 
                    userroleId: 1, //ADMIN == 1, VOLUNTEER == 2
                    auditstat: true
                }
        }
    )

    if (charRoleLinks.length < 1) {
        return {
            errors: [
                {
                    field: "user",
                    message: "User is not an admin of charity."
                }
            ],
            success: false
        } 
    }
  
    return {charIdReturned: charid, success: true};
  };