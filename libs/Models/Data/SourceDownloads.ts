import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";
import { User } from "../Auth/User";
import { Knowledge } from "../Knowledge/Knowledge";
import { Collateral } from "../Collateral/Collateral";
import { Organisation } from "../Organisation/Organisation";

// Models

interface sourceDownloadsAttributes {
    id?: bigint;
    user_id?: bigint;
    knowledge_id?: bigint | null;
    collateral_id?: bigint | null;
    organisation_id?: bigint | null;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type sourceDownloadsCreationAttributes = Optional<sourceDownloadsAttributes, "id">;

export class SourceDownload extends Model<sourceDownloadsAttributes, sourceDownloadsCreationAttributes> implements sourceDownloadsAttributes {
    public id!: bigint;
    public user_id!: bigint;
    public knowledge_id!: bigint | null;
    public collateral_id!: bigint | null;
    public organisation_id!: bigint | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

SourceDownload.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        user_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
        },

        knowledge_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },

        collateral_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },

        organisation_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },
    },
    {
        tableName: "source_downloads",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

SourceDownload.belongsTo(User, { as: "user", foreignKey: "user_id" });
SourceDownload.belongsTo(Knowledge, { as: "knowledge", foreignKey: "knowledge_id" });
SourceDownload.belongsTo(Collateral, { as: "collateral", foreignKey: "collateral_id" });
SourceDownload.belongsTo(Organisation, { as: "organisation", foreignKey: "organisation_id" });
