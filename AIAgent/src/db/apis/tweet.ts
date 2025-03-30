import { execute, executeTransaction } from '../pool.ts';
import { emptyOrRow, emptyOrRows } from "../helper.ts";
import fromEnv from '../../config/fromEnv.ts';

const chainPre = (fromEnv.CHAIN_PRE?.length > 0 && fromEnv.CHAIN_PRE !== 'base') ? fromEnv.CHAIN_PRE + '_' : '';

export const getRecentTweets = async (tick: string, agentUsername: string, limit: number = 30) => {
    let sql = `SELECT t.id as dbId, t.tweet_id as conversationId, t.tweet_id as id, t.content as text, t.tags as hashtags, t.page_info as pageInfo, 
    t.retweet_id as quotedStatusId, t.create_at as timeParsed,
    t.retweet_info as retweetInfo, t.tweet_time as tweetTime, t.tick, 
    t.like_count as likes, t.retweet_count as retweets, t.reply_count as replies,
    t.quote_count as quoteCount, 
    a.twitter_id as userId, a.twitter_name as name, a.twitter_username as username, a.profile, a.followers, a.followings,
    a.eth_addr as ethAddr
    FROM ${chainPre}tweet as t
    LEFT JOIN account as a ON a.twitter_id = t.twitter_id
    LEFT JOIN agent as ag ON ag.tick = t.tick
    WHERE t.id > ag.last_handled_tweet_id AND ag.tick = ? AND a.twitter_username != ? LIMIT ?`;

    let result = await execute(sql, [tick, agentUsername, limit]);
    return emptyOrRows(result);
}

export const updateLastHandledAgentTweetId = async (tick: string, dbId: number | string) => {
    if (fromEnv.TWITTER_DRY_RUN === 'true') return;
    let sql = `UPDATE agent SET last_handled_tweet_id = ? WHERE tick = ?`;
    await execute(sql, [dbId, tick]);
}

export const getRecentReplys = async (agentName: string) => {
    let sql = `SELECT t.tweet_id as tweetId, t.content, t.tags, t.page_info as pageInfo, 
    t.retweet_info as retweetInfo, t.tweet_time as tweetTime, t.tick, 
    t.like_count as likeCount, t.retweet_count as retweetCount, t.reply_count as replyCount,
    t.quote_count as quoteCount, a.twitter_name as twitterName, a.twitter_username as twitterUsername, a.profile, a.followers, a.followings,
    a.eth_addr as ethAddr
    FROM ${chainPre}relation_reply as r
    LEFT JOIN account as a ON a.twitter_id = r.twitter_id
    LEFT JOIN agent as ag ON ag.tick = r.tick
    WHERE r.id > ag.last_handled_reply_id AND ag.name = ?`;
    let result = await execute(sql, [agentName]);
    return emptyOrRows(result);
}

export const newLikeAction = async (twitterId: string, tweetId: string) => {
    if (fromEnv.TWITTER_DRY_RUN === 'true') return;
    let sql = `
        INSERT INTO relation_like (twitter_id, tweet_id) 
        SELECT ?, ?
        FROM ${chainPre}tweet
        WHERE tweet_id = ?;
        UPDATE ${chainPre}tweet SET like_count = like_count + 1 WHERE tweet_id = ?;
    `;
    await executeTransaction(sql, [twitterId, tweetId, tweetId, tweetId]);
}

export const newRetweetAction = async (twitterId: string, tweetId: string) => {
    if (fromEnv.TWITTER_DRY_RUN === 'true') return;
    let sql = `
        INSERT INTO relation_retweet (twitter_id, tweet_id) 
        SELECT ?, ?
        FROM ${chainPre}tweet
        WHERE tweet_id = ?;
        UPDATE ${chainPre}tweet SET retweet_count = retweet_count + 1 WHERE tweet_id = ?;
    `;
    await executeTransaction(sql, [twitterId, tweetId, tweetId, tweetId]);
}

export const getTweetCurationById = async (tweetId: string) => {
    let sql = `SELECT community_id as tick, day_number as dayNumber, curation_type as curationType
     FROM ${chainPre}curation WHERE tweet_id = ? AND is_settled = 0`;
    let result = await execute(sql, [tweetId]);
    return emptyOrRow(result);
}

export const newCurate = async (tweetId: string, twitterId: string, tick: string, vp: number) => {
    if (fromEnv.TWITTER_DRY_RUN === 'true') return 1;
    let sql = `CALL ${chainPre}new_curate(?,?,?,?,@isCuration);
                SELECT @isCuration;`;
    const res: any = await execute(sql, [tweetId, twitterId, tick, vp])
    if (res && res.length > 1) {
        return res[1][0]['@isCuration']
    }
    return 0;
}