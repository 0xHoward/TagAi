import { Provider, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import DeEvoAgent from "../../DeEvoAgent.ts";
import { getUserInfoByUsername, getUserVPOPByTwitterId } from "../../db/apis/user.ts";
import { getBalance, getEthBalance } from "../../utils/ethers.ts";
import fromEnv from "../../config/fromEnv.ts";

export const userRelatedProvider: Provider = {
    async  get(
        runtime: DeEvoAgent,
        message: Memory,
        state?: State
    ): Promise<String | null> {
        try {
            // get user tagai info
            if (state.source != "twitter" || !state.authorUsername) {
                return;
            }

            const userInfo = await getUserInfoByUsername(state.authorUsername as string);
            const tick = runtime.tick;
            const contract = runtime.contract;
            let result: null | string = ''
            // get user balance
            if (contract && userInfo.ethAddr) {
                const [ethBalance, tokenBalance] = await Promise.all([getEthBalance(userInfo.ethAddr, fromEnv.CHAIN_PRE.replace("_", "")), 
                    getBalance(userInfo.ethAddr, contract as string, fromEnv.CHAIN_PRE)]) 
                result += `@${state.authorUsername} has ${tokenBalance} $${tick} and $${tick} total supply is 1B.
@${state.authorUsername} has ${ethBalance} ETH balance.
@${state.authorUsername} has ${userInfo.followers} followers and ${userInfo.followings} followings.
`;
            }

            // provider user cureation vp and op
            if (message.content?.action?.toLowerCase() === 'curate') {
                const { vp, op } = await getVPOP(runtime, userInfo.twitterId);
                
                result += `@${state.authorUsername} has ${vp} VP and ${op} OP.`;
            }
            console.log('userRelatedProvider result:', result)
            if (result.length === 0) {
                return null;
            }
            return result;
        } catch (error) {
            elizaLogger.error(error);
        }
        return null;
    }
}

async function getVPOP(runtime: DeEvoAgent, twitterId: string) {
    const vpop = await getUserVPOPByTwitterId(twitterId);
    let vp = vpop.vp;
    let op = vpop.op;
    const lastUpdateVpStamp = vpop.lastUpdateVpStamp;
    const lastUpdateOpStamp = vpop.lastUpdateOpStamp;
    if ((!vp && vp !== 0) || !lastUpdateOpStamp) {
        vp ??= 0;
    }else {
        vp = (vp + (Date.now() - lastUpdateVpStamp) * runtime.maxVP / (864000000 * runtime.opvpRecoverDay))
        vp = vp > runtime.maxVP ? runtime.maxVP : vp
    }
    if ((!op && op !== 0) || !lastUpdateOpStamp) {
        op ??= 0;
    }else {
        op = (op + (Date.now() - lastUpdateOpStamp) * runtime.maxOP / (864000000 * runtime.opvpRecoverDay))
        op = op > runtime.maxOP ? runtime.maxOP : op
    }

    return { vp, op, lastUpdateVpStamp, lastUpdateOpStamp };
}