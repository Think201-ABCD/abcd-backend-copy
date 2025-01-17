import { body } from "express-validator";

export const Validate: any = (reqType: string) => {
    switch (reqType) {
        case "postSignin": {
            return [
                body("email")
                    //
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter your email address")
                    .bail()
                    .isEmail()
                    .withMessage("please enter a valid email address"),

                body("password")
                    //
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter your password"),
            ];
        }

        case "postSendResetPasswordOtp": {
            return [body("email").trim().notEmpty().withMessage("Please provide your email").isEmail().withMessage("Please provide a valid email address")];
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

        case "changePassword": {
            return [
                body("old_password").trim().notEmpty().withMessage("Please enter the old password"),

                body("new_password")
                    .trim()
                    .notEmpty()
                    .withMessage("Please enter the new password")
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

                    if (confirm_password !== req.body.new_password) {
                        throw new Error("Passwords do not match");
                    }

                    return true;
                }),
            ];
        }
    }
};
