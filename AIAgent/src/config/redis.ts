const KeyPre = 'tiptag-'
export default {
    REDIS_EXPIRE_TIME: 1000 * 60,
    STEEM_ACCOUNT_MAX_LENGTH: 9,
    REDIS_TWEET_KEY: 'tiptag_redis_tweet_key',
    REDIS_REGISTER_KEY: KeyPre + 'Register-steem-key',
    REDIS_REGISTERING_PRE: KeyPre + 'redis-is-registering-steem-',
    // cache the community ids those need to estimate space curation rewards
    REDIS_ESTIMATE_SPACE_REWARD_SET: KeyPre + 'redis-estimate-space-reward-set',
    // set by api when new curate operations occur
    REDIS_ESTIMATE_TWEET_REWARD_SET: KeyPre + 'redis-estimate-tweet-reward-set',
    TRENDING_COMMUNITY_IDS_LIST: KeyPre + 'trending-community-ids-list',
    REDIS_LAST_TWITTER_KEY_INDEX: KeyPre + 'last-twitter-key-index',
    REDIS_LAST_TWITTER_SEARCH_TIME: KeyPre + 'last-search-time',
    PREFIX_LAST_AISCORE_TIME: KeyPre + 'last-aiscore-time-',
    UserAuthKeyPre: KeyPre + process.env.UserAuthKeyPre,
}