import { execute } from '../pool.ts';
import { emptyOrRow, emptyOrRows } from "../helper.ts";

export const getCharacter = async (agentName: string) => {
    let sql = `SELECT twitter_id as twitterId, name, tick, bios, lores, topics, adjectives, postExamples, knowledges,
        style_all as styleAll, style_chat as styleChat, style_post as stylePost
     FROM agent WHERE name = ? LIMIT 1`;
    let result = await execute(sql, [agentName]);
    return emptyOrRow(result);
}

export const getProfileByTwitterId = async (twitterId: string) => {
    let sql = `SELECT twitter_id as twitterId, twitter_username as username, twitter_name as name,
     followers as followersCount, followings as followingCount, create_at as createdAt 
     FROM account WHERE twitter_id = ? LIMIT 1`;
    let result = await execute(sql, [twitterId]);
    return emptyOrRow(result);
}

export const getProfileByTwitterUsername = async (twitterUsername: string) => {
    let sql = `SELECT twitter_id as twitterId, twitter_username as username, twitter_name as name,
     followers as followersCount, followings as followingCount, create_at as createdAt 
     FROM account WHERE twitter_username = ? LIMIT 1`;
    let result = await execute(sql, [twitterUsername]);
    return emptyOrRow(result);
}

export const getProfileByAgentName = async (agentName: string) => {
    let sql = `SELECT a.twitter_id as twitterId, a.twitter_username as username, ag.name, a.eth_addr as ethAddr, a.sol_addr as solAddr,
     a.followers as followersCount, a.followings as followingCount, a.create_at as createdAt, ag.phone,
     ag.password, ag.email, ag.secret_2fa as secret2fa, ag.tick, c.token as contract
     FROM account as a 
     LEFT JOIN agent as ag ON ag.twitter_id = a.twitter_id
     LEFT JOIN community as c ON c.tick = ag.tick
     WHERE ag.name = ? LIMIT 1`;
    let result = await execute(sql, [agentName]);
    return emptyOrRow(result);
}