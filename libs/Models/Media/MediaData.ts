import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models

interface mediaDataAttributes {
    id?: bigint;
    entity_id?: bigint;
    entity?: string;
    type?: string;
    file?: string;
    file_aws?: string;
    file_name?: string | null;
}

export type mediaDataCreationAttributes = Optional<mediaDataAttributes, "id">;

export class MediaData extends Model<mediaDataAttributes, mediaDataCreationAttributes> implements mediaDataAttributes {
    public id!: bigint;
    public entity_id!: bigint;
    public entity!: string;
    public type!: string;
    public file!: string;
    public file_aws!: string;
    public file_name!: string | null;
}

MediaData.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        entity_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
        },

        entity: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        type: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },

        file: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        file_aws: {
            allowNull: true,
            type: DataTypes.VIRTUAL,
            get() {
                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("file")}`;
            },
        },

        file_name: {
            allowNull: true,
            type: DataTypes.STRING,
        },
    },
    {
        tableName: "media_data",
        sequelize,
        underscored: true,
        timestamps: false,
    }
);
