const log4js = require('log4js')

log4js.configure({
    appenders: {
        handleTweet: {
            type: "dateFile", filename: "logs/handle-tweet.log", pattern: "yy-MM-dd"
        },
        twitterApi: {
            type: "dateFile", filename: "logs/twitter-api.log", pattern: "yy-MM-dd"
        },
        db: {
            type: "dateFile", filename: "logs/db.log", pattern: "yy-MM-dd"
        },
        steem: {
            type: 'dateFile', filename: "logs/steem.log", pattern: 'yy-MM-dd'
        },
        graph: {
            type: 'dateFile', filename: "logs/graph.log", pattern: 'yy-MM-dd'
        },
        space: {
            type: 'dateFile', filename: "logs/space.log", pattern: 'yy-MM-dd'
        },
        curation: {
            type: 'dateFile', filename: "logs/curation.log", pattern: 'yy-MM-dd'
        },
        kchart: {
            type: 'dateFile', filename: "logs/kchart.log", pattern: 'yy-MM-dd'
        },
        ai: {
            type: 'dateFile', filename: "logs/ai.log", pattern: 'yy-MM-dd'
        },
        farcaster: {
            type: 'dateFile', filename: "logs/farcaster.log", pattern: 'yy-MM-dd'
        },
        consoleout: {
            type: "console",
            layout: { type: "colored" }
        }
    },
    categories: { 
        default: { appenders: ["handleTweet", "consoleout", 'twitterApi', "db"], level: "debug" },
        handleTweet: { appenders: ["handleTweet", "consoleout"], level: "debug" },
        twitterApi: { appenders: ["twitterApi", "consoleout"], level: "debug" },
        db: { appenders: ["db", "consoleout"], level: "debug" },
        steem: { appenders: ["steem", "consoleout"], level: "debug" },
        graph: { appenders: ["graph", "consoleout"], level: "debug" },
        space: { appenders: ["space", "consoleout"], level: "debug" },
        curation: { appenders: ["curation", "consoleout"], level: "debug" },
        kchart: { appenders: ["kchart", "consoleout"], level: "debug" },
        ai: { appenders: ["ai", "consoleout"], level: "debug" },
        farcaster: { appenders: ["farcaster", "consoleout"], level: "debug" }
    }
});

export default log4js