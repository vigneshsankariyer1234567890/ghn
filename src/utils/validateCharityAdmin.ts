import { Charity } from "../entities/Charity";
import { Charityrolelink } from "../entities/Charityrolelink";
import { CharityUserInput } from "./CharityUserInput";

export const validateCharityAdmin = async (options: CharityUserInput) => {
    
    const char = await Charity.findOne({where: {uen:options.uen}});

    if (!char) {
        return [
            {
                field: "uen",
                message: "There is no such charity which corresponds to the UEN provided."
            }
        ]
    }

    const charid = char.id;

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
        return [
            {
                field: "user",
                message: "User is not an admin of charity."
            }
        ]
    }
  
    return null;
  };