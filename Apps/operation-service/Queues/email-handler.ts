import { fn, col } from "sequelize";

// Helpers
import { sendEmail } from "@redlof/libs/Helpers/EmailHelper";
import { generateOTP } from "@redlof/libs/Helpers/helpers";
import { redisHgetAsync } from "@redlof/libs/Loaders/redis";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Organisation } from "@redlof/libs/Models/Organisation/Organisation";
import { Workspace } from "@redlof/libs/Models/Workspace/Workspace";

export const emailHandler = async function ({ type, data }: any) {
    try {
        let user: any;
        let admin: any;
        let organisation: any;
        let workspace: any;

        if (data.user_id) {
            user = await User.findByPk(data.user_id);
            if (!user) {
                console.log("User not found - " + data.user_id);
                return true;
            }
        }

        if (data.admin_id) {
            admin = await User.findByPk(data.admin_id);
            if (!admin) {
                console.log("Admin not found - " + data.admin_id);
                return true;
            }
        }

        if (data.organisation_id) {
            organisation = await Organisation.findOne({ where: { id: data.organisation_id } });
            if (!organisation) {
                console.log("Organisations not found - " + data.organisation_id);
                return true;
            }
        }

        if (data.workspace_id) {
            workspace = await Workspace.findOne({ where: { id: data.workspace_id } });
            if (!workspace) {
                console.log("workspaces not found - " + data.workspace_id);
                return true;
            }
        }

        switch (type) {
            case "email-welcome":
                await sendEmail(user.email, "mail-welcome.ejs", { subject: "Welcome to ABCD!", user });

                break;

            case "email-organisation-rejected":
                await sendEmail(user.email, "email-organisation-rejected.ejs", { subject: "Request rejected", user });

                break;

            case "signup-otp":
                user = JSON.parse(await redisHgetAsync("user_data", String(data.token)));

                if (!user) {
                    console.log("User not found in redis");
                }

                await sendEmail(user.email, "signup-otp.ejs", {
                    subject: "ABCD: One-Time Password (OTP) Verification",
                    user,
                    otp: data.otp,
                });

                break;

            case "reset-password-link": {
                const reset_link = `${process.env.FRONT_DOMAIN}/onboarding/reset-password?token=${data.token}`;

                await sendEmail(user.email, "reset-password-link.ejs", {
                    subject: "Reset password link",
                    user,
                    reset_link,
                });

                break;
            }

            case "reset-otp": {
                await sendEmail(user.email, "reset-otp.ejs", {
                    subject: "ABCD: Reset password One-Time Password (OTP)",
                    user_name: `${user.first_name} ${user.last_name}`,
                    otp: data.otp,
                });

                break;
            }
            case "resend-otp": {
                const redisOTPData = JSON.parse(await redisHgetAsync("user_otps", String(data.token)));

                await sendEmail(redisOTPData.email, "resend-otp.ejs", { subject: "Resend otp", otp: redisOTPData.otp });

                break;
            }
            case "email-organisation-member-welcome":
                await sendEmail(user.email, "email-organisation-member-welcome.ejs", {
                    subject: "Welcome to Atlas for behaviour change in development",
                    user,
                    admin,
                    organisation,
                    password: data.password,
                });

                break;

            case "email-organisation-welcome":
                await sendEmail(user.email, "email-organisation-welcome.ejs", {
                    subject: "Welcome to Atlas for behaviour change in development",
                    user,
                    organisation,
                    password: data.password,
                });

                break;

            case "email-workspace-invite":
                await sendEmail(user ? user.email : data.email, "email-workspace-invitation.ejs", {
                    subject: `Invitation : You have been invited to ${workspace.name} workspace`,
                    user,
                    organisation,
                    workspace,
                    data,
                });

                break;

            case "organisation-member-request":
                await sendEmail(admin.email, "email-organisation-member-request.ejs", {
                    subject: `Request : ${user.first_name} has requested to join the organisation`,
                    user,
                    organisation,
                    admin,
                });

                break;

            case "organisation-member-request-first":
                await sendEmail(admin.email, "email-organisation-admin.ejs", {
                    subject: `Request : ${user.first_name} has requested to join the organisation`,
                    user,
                    organisation,
                    admin,
                });

                break;

            case "email-change-member-role":
                await sendEmail(user.email, "email-change-member-role.ejs", {
                    subject: `Notification : ${admin.first_name} has changed your role for the ${data.workspace_name} workspace`,
                    data,
                });

                break;

            case "email-corpus-editor-invite":
                await sendEmail(user.email, "email-corpus-editor-invite.ejs", {
                    subject: `Notification : You have been invited to ABCD Corpus`,
                    data,
                    user,
                });

                break;

            case "email-organisation-approved":
                await sendEmail(user.email, "email-organisation-approved.ejs", {
                    subject: `Notification : Request to add organisation ${organisation.name} accepted`,
                    data,
                    user,
                    organisation,
                });

                break;

            case "email-organisation-member-added":
                await sendEmail(user.email, "email-organisation-member-added.ejs", {
                    subject: `Notification : Added to new organisation`,
                    data,
                    user,
                    organisation,
                });

                break;

            case "email-organisation-admin-members-added":
                await sendEmail(admin.email, "email-organisation-admin-members-added.ejs", {
                    subject: `Notification : Members added to your organisation`,
                    admin,
                    data,
                    organisation,
                });

                break;

            case "email-organisation-admin-member-removed":
                await sendEmail(admin.email, "email-organisation-admin-member-removed.ejs", {
                    subject: `Notification : Member removed from your organisation`,
                    admin,
                    user,
                    organisation,
                });

                break;

            case "email-organisation-member-removed":
                await sendEmail(user.email, "email-organisation-member-removed.ejs", {
                    subject: `Notification : Removed from organisation`,
                    user,
                    organisation,
                });

                break;

            case "user-does-not-exist":
                await sendEmail(data.email, "analyser-no-user-found.ejs", {
                    subject: "Notification: Please create an account",
                    analysis: true,
                });

                break;

            case "analyser-quick-reply": {
                const analysisType = data.type === "analyze" ? "Analysis" : "Evaluation";
                await sendEmail(user.email, "analyser-quick-mail.ejs", {
                    subject: `Notification: Document ${analysisType} Inititated: Will get back to you shortly`,
                    user_name: `${user.first_name} ${user.last_name}`,
                    analysis: true,
                });

                break;
            }

            case "add-attachment":
                await sendEmail(user.email, "analyser-attachment-required.ejs", {
                    subject: "Notification: Attachment is required for analysis",
                    user_name: `${user.first_name} ${user.last_name}`,
                    analysis: true,
                });
                break;

            case "analysis-complete": {
                const subject = data.input_file_name ? `Behavioural analysis for '${data.input_file_name}' completed` : "Behavioural analysis of your document completed";
                await sendEmail(
                    user.email,
                    "analyser-complete.ejs",
                    {
                        subject: subject,
                        user_name: `${user.first_name} ${user.last_name}`,
                        analysis: true,
                    },
                    data.attachments
                );
                break;
            }

            case "evaluation-complete": {
                const subject = data.input_file_name ? `Behavioural evaluation for '${data.input_file_name}' completed` : "Behavioural evaluation of your document completed";
                await sendEmail(
                    user.email,
                    "evaluation-complete.ejs",
                    {
                        subject: subject,
                        user_name: `${user.first_name} ${user.last_name}`,
                        analysis: true,
                    },
                    data.attachments
                );
                break;
            }

            case "attachment-validation":
                await sendEmail(user.email, "analyser-attachment-size.ejs", {
                    subject: "Notification: Document cannot be more than 10 MB",
                    user_name: `${user.first_name} ${user.last_name}`,
                    analysis: true,
                });

                break;

            case "analyser-attachment-limit-exceeded":
                await sendEmail(user.email, "analyser-attachment-limit-exceeded.ejs", {
                    subject: "4 attachments is the maximum limit for analysis",
                    user_name: `${user.first_name} ${user.last_name}`,
                    analysis: true,
                });

                break;

            case "email-weekly-signups":
                await sendEmail(
                    data.info.email,
                    "email-weekly-signups.ejs",
                    {
                        subject: "Notification: Weekly signups",
                        data: data.info,
                    },
                    data.attachments
                );
                break;

            case "send-analyzed-file": {
                const subject = data.input_file_name ? `Analysis for '${data.input_file_name}' completed` : "Analysis of your document completed";
                await sendEmail(
                    user.email,
                    "analysis-web-complete.ejs",
                    {
                        subject: subject,
                        user_name: `${user.first_name} ${user.last_name}`,
                        analysis: true,
                    },
                    data.attachments
                );
                break;
            }

            case "send-evaluated-file": {
                const subject = data.input_file_name ? `Evaluation for '${data.input_file_name}' completed` : "Evaluation of your document completed";
                await sendEmail(
                    user.email,
                    "evaluation-web-complete.ejs",
                    {
                        subject: subject,
                        user_name: `${user.first_name} ${user.last_name}`,
                        analysis: true,
                    },
                    data.attachments
                );
                break;
            }

            case "monthly-source-download-report":
                await sendEmail(data.org_admin_email, "monthly-source-download-report.ejs", {
                    // await sendEmail("abcd@think201.xyz", "monthly-source-download-report.ejs", {
                    subject: "Knowledge and collateral library source downloads",
                    data,
                });
                break;

            default:
                throw `Case not found - ${type}`;
        }

        console.log("Email sent for", type);

        return;
    } catch (e) {
        console.error("Email Handler error", e);

        return;
    }
};
