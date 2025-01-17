module.exports = {
    apps: [
        {
            name: "@abcd/cockpit-api",
            script: "../build/ai-cockpit-service/api/Apps/ai-cockpit-service/app.js",
            time: true,
            exec_mode: "fork",
            instances: 1,
            log_date_format: "MM-DD HH:mm",
        },
    ],
};