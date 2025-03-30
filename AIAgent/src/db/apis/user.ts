import { execute } from "../pool.ts";
import { emptyOrRows, emptyOrRow } from "../helper.ts";

export const getUserInfoByUsername = async (username: string) => {
    let sql = `SELECT twitter_id as twitterId, followers, followings, 
    eth_addr as ethAddr, sol_addr as solAddr, btc_addr as btcAddr
    FROM account WHERE twitter_username = ?`;
    let result = await execute(sql, [username]);
    return emptyOrRow(result);
}

export const getUserVPOPByTwitterId = async (twitterId: string) => {
    let sql = `SELECT vp, last_update_vp_stamp as lastUpdateVpStamp, op, last_update_op_stamp as lastUpdateOpStamp
                FROM account WHERE twitter_id =? LIMIT 1;`
    return emptyOrRow(await execute(sql, [twitterId]))
}