import { DataTypes, Model, Optional } from "sequelize";

// Connection
import { sequelize } from "../../Loaders/database";

// Models
import { User } from "../Auth/User";

interface CorpusAttributes {
    id?: bigint;
    uuid?: string;
    url?: string;
    page_meta?: Text;
    file?: string;
    file_meta?: JSON;
    comment?: string;
    tags?: JSON;
    user_id?: bigint;
    status?: string;
    reviewer_id?: bigint;
    type?: string;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export type CorpusCreationAttributes = Optional<CorpusAttributes, "id">;

export class Corpus extends Model<CorpusAttributes, CorpusCreationAttributes> implements CorpusAttributes {
    public id!: bigint;
    public uuid!: string;
    public url!: string;
    public page_meta!: Text;
    public file!: string;
    public file_meta!: JSON;
    public comment!: string;
    public tags!: JSON;
    public user_id!: bigint;
    public status!: string;
    public reviewer_id!: bigint;
    public type!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public deleted_at!: Date;
}

Corpus.init(
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT,
        },

        uuid: {
            allowNull: false,
            type: DataTypes.UUID,
        },

        url: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        page_meta: {
            allowNull: true,
            type: DataTypes.TEXT,
            get() {
                let data: any = this.getDataValue("page_meta");
                return JSON.parse(data);
            },
        },

        file: {
            allowNull: true,
            type: DataTypes.STRING,
            get() {
                const file = this.getDataValue("file");

                if (!file) {
                    return null;
                }

                return `${process.env.AWS_BASE_URL}` + `${this.getDataValue("file")}`;
            },
        },

        file_meta: {
            allowNull: true,
            type: DataTypes.JSONB,
        },

        comment: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        tags: {
            allowNull: true,
            type: DataTypes.JSONB,
        },

        user_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
        },

        status: {
            allowNull: false,
            type: DataTypes.STRING,
        },

        reviewer_id: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },

        type: {
            allowNull: true,
            type: DataTypes.STRING,
        },

        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
        },

        deleted_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
    },
    {
        tableName: "corpus",
        sequelize,
        underscored: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
    }
);

Corpus.belongsTo(User, { as: "user", foreignKey: "user_id" });
Corpus.belongsTo(User, { as: "reviewer", foreignKey: "reviewer_id" });
