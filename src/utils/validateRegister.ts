import { UsernamePasswordInput } from "./UsernamePasswordInput";
// import validate from "deep-email-validator";
import {emailVerification} from "./sendEmail"



export const validateRegister = async (options: UsernamePasswordInput) => {
    if (!emailVerification.test(options.email)) {
      return [
            { 
              field: "email",
              message: "Please key in a valid email.",
            },
          ];
    }
  
    if (options.username.length <= 8) {
      return [
        {
          field: "username",
          message: "length must be greater than 8",
        },
      ];
    }
  
    if (options.username.includes("@")) {
      return [
        {
          field: "username",
          message: "cannot include an @",
        },
      ];
    }
  
    if (options.password.length <= 8) {
      return [
        {
          field: "password",
          message: "length must be greater than 8",
        },
      ];
    }
  
    return null;
  };