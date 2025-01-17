import { RequestHandler } from "express";
import { Op } from "sequelize";
import Bull from "bull";

//Helpers
import { api, apiException } from "@redlof/libs/Helpers/helpers";

// Models
import { User } from "@redlof/libs/Models/Auth/User";
import { Role } from "@redlof/libs/Models/Auth/Role";
import { UserProfile } from "@redlof/libs/Models/Auth/UserProfile";
import { Topic } from "@redlof/libs/Models/Topic/Topic";
import { UserTopic } from "@redlof/libs/Models/Individual/UserTopic";
import { Behaviour } from "@redlof/libs/Models/Behaviour/Behaviour";
import { UserBehaviour } from "@redlof/libs/Models/Individual/UserBehaviour";
import { UserOutcome } from "@redlof/libs/Models/Individual/UserOutcome";
import { Outcome } from "@redlof/libs/Models/Outcome/Outcome";

export const getMembers: RequestHandler = async (req, res) => {
    const query: any = {};
    const include: any = [{ model: Role, as: "roles", where: { slug: "role-member" }, required: true }];

    if (req.query.status) {
        query.status = req.query.status;
    }

    if (req.query.type) {
        include.push({
            model: UserProfile,
            as: "profile",
            where: { type: req.query.type },
            required: true,
        });
    }

    const members = await User.findAll({
        attributes: { exclude: ["password"] },
        where: query,
        order: [["created_at", "desc"]],
        include,
    });

    return api("", res, members);
};

export const getMember: RequestHandler = async (req, res) => {
    const member = await User.findOne({
        attributes: { exclude: ["password"] },
        where: { uuid: req.params.uuid },
        include: [{ model: UserProfile, as: "profile", required: true }],
    });

    if (!member) {
        throw { message: "User does not found.", code: 422 };
    }

    return api("", res, member);
};

export const putMember: RequestHandler = async (req, res) => {
    return api("", res, {});
};

export const postMemberPreferences: RequestHandler = async (req, res) => {
    const member = await User.findOne({
        attributes: { exclude: ["password"] },
        where: { uuid: req.params.uuid },
    });

    if (!member) {
        throw { message: "User does not found", code: 422 };
    }

    if (req.body.topics && req.body.topics.length > 0) {
        const topics = await Topic.findAll({ where: { uuid: { [Op.in]: req.body.topics } } });

        if (topics.length <= 0) {
            throw { message: "Please select at least one topic", code: 422 };
        }

        const data: any = [];

        for (const topic of topics) {
            data.push({
                user_id: member.id,
                topic_id: topic.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Mail
        await new Bull(`${process.env.REDIS_EMAIL_QUEUE}`).add({
            type: "email-welcome",
            data: { user_id: member.id },
        });

        // Remove old preferences
        await UserTopic.destroy({ where: { user_id: member.id } });

        await UserTopic.bulkCreate(data);
    }

    if (req.body.behaviours && req.body.behaviours.length > 0) {
        const behaviours = await Behaviour.findAll({ where: { uuid: { [Op.in]: req.body.behaviours } } });

        if (behaviours.length <= 0) {
            throw { message: "Please select at least one topic", code: 422 };
        }

        const data: any = [];

        for (const behaviour of behaviours) {
            data.push({
                user_id: member.id,
                behaviour_id: behaviour.id,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        // Remove old preferences
        await UserBehaviour.destroy({ where: { user_id: member.id } });

        await UserBehaviour.bulkCreate(data);
    }

    // Update the user status, if it is in yet to start
    if (member.status == "yet_to_join") {
        member.status = "pending";
        await member.save();
    }

    return api("Preferences saved successfully.", res, {});
};

export const getMemberPreferences: RequestHandler = async (req, res) => {
    const member = await User.findOne({ attributes: { exclude: ["password"] }, where: { uuid: req.params.uuid } });

    if (!member) {
        throw { message: "User does not found", code: 422 };
    }

    // Get user topics
    const topicId = [...(await UserTopic.findAll({ where: { user_id: member.id } }))].map(
        (userTopic: any) => userTopic.topic_id
    );

    const topics = await Topic.findAll({
        attributes: { exclude: ["added_by", "updated_at", "deleted_at", "sdgs"] },
        order: [["created_at", "desc"]],
        where: { id: { [Op.in]: topicId }, status: "published" },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
            },
        ],
    });

    // Get user behavioues
    const behaviourId = [...(await UserBehaviour.findAll({ where: { user_id: member.id } }))].map(
        (userBehaviour: any) => userBehaviour.behaviour_id
    );

    const behaviours = await Behaviour.findAll({
        attributes: { exclude: ["added_by", "updated_at", "deleted_at"] },
        order: [["created_at", "desc"]],
        where: { id: { [Op.in]: behaviourId }, status: "published" },
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
            },
        ],
    });

    // Get user outcomes
    const outcomeId = [...(await UserOutcome.findAll({where: { user_id: member.id } }))].map(
        (userOutcome: any) => userOutcome.outcome_id
    )

    const outcomes = await Outcome.findAll({
        attributes: { exclude: ["added_by", "updated_at", "deleted_at"]},
        order: [["created_at", "desc"]],
        where: { id: { [Op.in]: outcomeId}, status: "published"},
        include: [
            {
                as: "created_by",
                model: User,
                attributes: ["uuid", "first_name", "last_name", "photo"],
            },
        ],
    })

    return api("", res, { topics, behaviours, outcomes });
};

export const postBannerPhotoBulkUpdate: RequestHandler = async (req, res) => {
    await User.update(
        { banner: "profile-banner/d2b29779-fad6-43fa-859e-f3fb26f9095f.png" },
        { where: { banner: null } }
    );

    return api("Script run successfully.", res, {});
};
