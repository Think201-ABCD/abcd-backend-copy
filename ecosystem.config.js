module.exports = {
    apps: [
        {
            name: "ABCD auth service",
            script: "npm run start",
            cwd: "./Apps/auth-service",
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            },
        },
        {
            name: "ABCD data service",
            script: "npm run start",
            cwd: "./Apps/data-service",
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            },
        },
        {
            name: "ABCD user service",
            script: "npm run start",
            cwd: "./Apps/user-service",
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            },
        },
        {
            name: "ABCD operation service",
            script: "npm run start",
            cwd: "./Apps/operation-service",
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            },
        },
    ],
};
