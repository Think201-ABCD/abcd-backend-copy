import { body, param, query } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postCheckUser": {
            return [body("email").notEmpty().withMessage("Please enter your email ID").bail().isEmail().withMessage("Please enter a valid email")];
        }

        case "postSignin": {
            return [
                body("email").notEmpty().withMessage("Please provide your email").isEmail().withMessage("Please enter a valid email"),
                body("password").notEmpty().withMessage("Please enter the password"),
            ];
        }

        case "postSignup": {
            return [
                body("first_name")
                    .notEmpty()
                    .withMessage("Please enter your first name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("First name cannot be more than 255 characters")
                    .bail()
                    .trim()
                    .isAlpha()
                    .withMessage("First name must only contain alphabets"),

                body("last_name")
                    .notEmpty()
                    .withMessage("Please enter your last name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Last name cannot be more than 255 characters")
                    .bail()
                    .trim()
                    .isAlpha()
                    .withMessage("Last name must only contain alphabets"),

                body("email").notEmpty().withMessage("Please enter your email ID").bail().isEmail().withMessage("Please enter a valid email"),

                body("password")
                    .notEmpty()
                    .withMessage("Please enter the password")
                    .bail()
                    .isLength({ min: 8, max: 15 })
                    .withMessage("Password must be atleast 8 characters and atmost 15 characters long ")
                    .bail()
                    .matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
                    .withMessage("Weak password. Password must include atleast 1 uppercase, 1 lowercase, 1 number and a special character."),

                body("company").notEmpty().withMessage("Please enter your company name"),

                body("phone").optional({ checkFalsy: true }).isString().withMessage("Phone number must be a string").isMobilePhone("any").withMessage("Please provide a valid phone number"),
            ];
        }

        case "postVerifyOTPSignup": {
            return [
                body("otp").notEmpty().withMessage("Please enter the otp").isInt().withMessage("Invalid otp").bail().isLength({ min: 6, max: 6 }).withMessage("Otp must be 6 characters long").bail(),

                body("email").notEmpty().isEmail().withMessage("Invalid request"),
            ];
        }

        case "postSendResetPasswordOtp": {
            return [body("email").trim().notEmpty().withMessage("Please provide your email")];
        }

        case "postResetPassword": {
            return [
                body("otp").trim().notEmpty().isNumeric().withMessage("Please provide reset OTP"),

                body("email").trim().notEmpty().withMessage("Please provide your email").bail().isEmail().withMessage("Please provide valid email"),

                body("password")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the password")
                    .bail()
                    .isLength({ min: 6 })
                    .withMessage("Password must be atleast 6 charaters long")
                    .bail()
                    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/gm)
                    .withMessage("Password must contain atleast one number, one uppercase alphabet, one lowercase alphabet and one special character "),

                body("confirm_password").custom((confirm_password, { req }) => {
                    if (!confirm_password) {
                        throw new Error("Please provide confirm password");
                    }

                    if (confirm_password !== req.body.password) {
                        throw new Error("Passwords do not match");
                    }

                    return true;
                }),
            ];
        }
    }
};
