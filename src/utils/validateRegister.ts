import { UsernamePasswordInput } from "./UsernamePasswordInput";
import validate from "deep-email-validator";



export const validateRegister = async (options: UsernamePasswordInput) => {
    const valid = (await validate(options.email)).valid;

    if (!valid) {
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