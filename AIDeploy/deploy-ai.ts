import dotenv from 'dotenv';
import log4js from '../../utils/logger';
import { sleep, sleep2 } from '../../utils/helper';
import { getPendingDeployTick, getPendingParentTweets, getPendingReplyTick, newCommunity, setCancelReason, setParentTweets } from '../../db/api/ai-deploy';
import { getTweetsByIds } from '../../utils/twitter-api';
import { generateTick } from './openrouter';
import { deployTick } from '../../utils/pump';
import aiConfig from '../../config/ai';
import { generateImage } from './stability';
import { findImageLink, getAuthor, showOriginalUrl } from '../../utils/twitterHandler';
import { getCommunityByTick } from '../../db/api/community';

const logger = log4js.getLogger('ai')
dotenv.config();

let isRun = true;

process.on('SIGINT', () => {
    isRun = false;
    logger.debug('Polling parent tweets stopping..')
})

async function pollingCreateDeployTick() {
    logger.info('Polling create deploy tick start...')
    while (isRun) {
        try {
            const tweet = await getPendingDeployTick()
            if (tweet && tweet.parentTweet) {
                // check tick
                if (tweet.tick) {
                    const community = await getCommunityByTick(tweet.tick)
                    if (community && community.tick) {
                        logger.debug(`The tick ${tweet.tick} is already used.`)
                        await setCancelReason(tweet.parentId, 'The tick is already used.');
                        continue;
                    }
                }
                logger.debug(`Found pending deploy tick: ${tweet.parentId}`)
                let originalTweet = JSON.parse(tweet.parentTweet)
                let replyTweet = tweet.tweet ? JSON.parse(tweet.tweet) : null;

                let imageUrl = findImageLink(originalTweet)
                originalTweet = showOriginalUrl(originalTweet)
                originalTweet.data.text = originalTweet.data.text.replace('@TagAIDAO #deploy', '')
                if (replyTweet) {
                    replyTweet.data.text = replyTweet.data.text.replace('@TagAIDAO #deploy', '')
                }
                const author = getAuthor(originalTweet)
                // generate deploy tick
                let newTick = await generateTick(originalTweet.data.text, imageUrl, tweet.tick, replyTweet?.data.text, replyTweet?.data.id ?? originalTweet.data.id)
                if (!newTick) {
                    await setCancelReason(tweet.parentId, 'There is no deploy intent.');
                    continue;
                }
                // generate logo
                let logo: string | null;
                if (newTick.picturePrompt === 'Use pic') { 
                    logo = imageUrl
                }else {
                    logo = await generateImage(newTick.picturePrompt)
                    if (!logo) {
                        logger.error(`Generate logo failed for ${newTick.tick}`)
                        continue;
                    }
                }
                
                const twitter = `https://x.com/tagaidao/status/${tweet.tweetId ?? tweet.parentId}`
               
                // deploy tick
                try {
                    const result = await deployTick(newTick.tick)
                    if (result) {
                        logger.debug(`Deploy tick success: ${result.hash} ${result.token}`)
                        const createForm = {
                            createHash: result.hash,
                            token: result.token,
                            twitterId: aiConfig.TIPTAG_AI_TWITTER_ID,
                            logoUrl: logo,
                            creator: aiConfig.TIPTAG_EVM_ADDRESS,
                            twitter,
                            parentId: tweet.parentId,
                            tweetId: tweet.tweetId,
                            ...newTick
                        }
                        await newCommunity(createForm)
                        logger.debug(`Deploy community success: ${result.hash} ${result.token}`)
                    }
                } catch (error) {
                    console.log('deploy tick error', error)
                    // set cancel reason
                    setCancelReason(tweet.parentId, 'Deploy tick failed').catch(logger.error)
                } 
            }
        } catch (error) {
            logger.error(`Error polling create deploy tick:`, error)
            await sleep(30);
        }
        await sleep(3);
    }
    logger.debug('Polling create deploy tick stopped...')
}

Promise.all([pollingFetchParentTweets(), pollingCreateDeployTick()]).catch(logger.error).finally(() => {
    logger.info('AI deploy tick service stopped...')
});