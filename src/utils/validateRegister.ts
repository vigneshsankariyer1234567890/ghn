import { UsernamePasswordInput } from "./UsernamePasswordInput";
import * as EmailValidator from  "email-validator"


export const validateRegister = (options: UsernamePasswordInput) => {
    if (! (EmailValidator.validate(options.email))) {
      return [
        {
          field: "email",
          message: "Please key in a valid email.",
        },
      ];
    }
  
    if (options.username.length <= 2) {
      return [
        {
          field: "username",
          message: "length must be greater than 2",
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
  
    if (options.password.length <= 2) {
      return [
        {
          field: "password",
          message: "length must be greater than 2",
        },
      ];
    }
  
    return null;
  };