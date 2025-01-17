import { body, param, query } from "express-validator";
import { User } from "@redlof/libs/Models/Auth/User";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postSignup": {
            return [
                body("first_name")
                    .optional()
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
                    .optional()
                    .notEmpty()
                    .withMessage("Please enter your last name")
                    .bail()
                    .isLength({ max: 255 })
                    .withMessage("Last name cannot be more than 255 characters")
                    .bail()
                    .trim()
                    .isAlpha()
                    .withMessage("Last name must only contain alphabets"),

                body("email")
                    .notEmpty()
                    .withMessage("Please enter your email ID")
                    .bail()
                    .isEmail()
                    .withMessage("Please enter a valid email")
                    .bail()
                    .custom(async (email: any, { req }: any) => {
                        const user: any = await User.findOne({ where: { email: email } });

                        if (user) {
                            return Promise.reject("Email is taken. Please enter another email id");
                        }

                        return Promise.resolve();
                    }),

                body("password")
                    .notEmpty()
                    .withMessage("Please enter the password")
                    .bail()
                    .isLength({ min: 8, max: 15 })
                    .withMessage("Password must be atleast 8 characters and atmost 15 characters long ")
                    .bail()
                    .matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
                    .withMessage(
                        "Weak password. Password must include atleast 1 uppercase, 1 lowercase, 1 number and a special character."
                    ),

                body("type")
                    .notEmpty()
                    .withMessage("Please select the user type")
                    .bail()
                    .isIn(["organisation", "individual"])
                    .withMessage("Invalid user type"),

                body("token").optional().isUUID().withMessage("Invalid request"),

                body("invite_uuid").optional().isUUID().withMessage("Invalid request"),
            ];
        }

        case "getSignup": {
            return [query("uuid").isUUID().withMessage("Invalid user")];
        }

        case "postSignin": {
            return [
                body("username").notEmpty().withMessage("Please provide your email"),
                body("password").notEmpty().withMessage("Please enter the password"),
            ];
        }

        case "postVerifyOTPSignup": {
            return [
                body("otp")
                    .notEmpty()
                    .withMessage("Please enter the otp")
                    .isInt()
                    .withMessage("Invalid otp")
                    .bail()
                    .isLength({ min: 6, max: 6 })
                    .withMessage("Otp must be 6 characters long")
                    .bail(),

                body("token").isUUID().withMessage("Invalid request"),
            ];
        }

        case "postSendResetPasswordLink": {
            return [
                body("email")
                    .notEmpty()
                    .withMessage("Please enter your email id")
                    .bail()
                    .isEmail()
                    .withMessage("Please enter a valid email"),

                body("token").optional().isUUID().withMessage("Invalid request"),
            ];
        }

        case "postResetPassword": {
            return [
                body("token").isUUID().withMessage("Invalid request"),

                body("password")
                    .notEmpty()
                    .withMessage("Please enter the password.")
                    .bail()
                    .isLength({ min: 8, max: 15 })
                    .withMessage("Password must be atleast 8 characters and atmost 15 characters long ")
                    .bail()
                    .matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
                    .withMessage(
                        "Weak password. Password must include atleast 1 upper, 1 lowercase, 1 number and a special characters."
                    ),

                body("confirm_password")
                    .notEmpty()
                    .withMessage("Please enter your new password again to confirm.")
                    .bail()
                    .custom((value: any, { req }: any) => {
                        if (req.body.password !== value) {
                            return Promise.reject("Confirm password does not match the password. Please try again");
                        }

                        return Promise.resolve();
                    }),
            ];
        }

        case "postResendOTP": {
            return [body("token").isUUID().withMessage("Invalid request")];
        }

        case "getInvitation": {
            return [param("uuid").isUUID().withMessage("Invalid request")];
        }
    }
};
