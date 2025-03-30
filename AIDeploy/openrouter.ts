import OpenAI from 'openai';
import dotenv from 'dotenv';
import log4js from '../../utils/logger';
import { checkTickExist } from '../../db/api/community';

const logger = log4js.getLogger('ai')

dotenv.config();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1-zero:free';

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'X-Title': 'tiptag-deployer',
    },
});

export async function generateTick(text: string, imageUrl?: string, ticker?: string | null | undefined, replyText?: string | null | undefined, tweetId?: string) {
    const basePrompt = `You are a meme coin creator. You are given a tweet content, which may also include a reply. 
    You need to generate the following informations:
    - Tick: The tick of the meme coin.
        * Try to understand if there is a specified deployment tick in the given tweet or the reply.
        * If you are given a tick, please use it directly.
        * Or you need to understand the meaning of the content of the tweet and generate a tick, instead of directly extracting a word from the tweet to use as a tick, unless the tweet is mainly describing this tick.
        * The tick should be a short name for the meme coin, such as "DOGE", "SHIB", "PEPE", etc. 
        * It should only contain letters in [a-zA-Z], no numbers or special characters. The tag length should be between 3 and 12.
    - Tags: community tags.
        * The tags should be a list of tags that are related to the meme coin. 
        * It should be letters in [a-zA-Z], and the length of each tag should be between 3 and 7, total less than 3 tags.
    - Description: The description of the meme coin.
        * The description should revolve around the tweet I gave you, with a word count between 1-50 words. 
        * When creating, please consider that you are an expert in the knowledge BSC chain and MEME communication of the web3 industry. 
        * Based on your understanding of the web3 industry and knowledge of communication studies, create content based on tweets that are objective, realistic, imaginative, humorous, interesting, and attractive.
        * Randomly use a descriptive approach instead of always describing with a fixed structure. For example, do not always start with "Introducing".
    - Picture Prompt: The prompt for the picture prepare for stable diffusion model.
        * If you are given an image, please use it directly or retrieve relevant elements from the image to generate the prompt.
        * Or provide a detailed description of the prompt for the image as much as possible for the generated tick and description.
        * Randomly choose three of the following keywords as the style of the image: low quality、 low detail、 low resolution、 blurry、 pixelated、 cartoon、 sketch、 artistic fonts、 fantasy-art、 art、 punk、 pixel-art、 brief strokes、 realistic writing,etc. 
        * Important thing to the prompt: less than 300kb.
        * The prompt should be in English and less than 2000 words.
    The output should be a JSON object with the following format:
    {
        "tick": "The tick of the meme coin.",
        "tags": "The tags of the meme coin.",
        "desc": "The description of the meme coin.",
        "picturePrompt": "The prompt for the picture prepare for stable diffusion model."
    }

    * If I don't give you the reply, and there's no intent to deploy a tick in the tweet, You can just return empty JSON object like '{}'.
    `
    let messages: any = [
        { role: 'system', content: basePrompt },
        { role: 'user', content: 'Tweet: ' + text}
    ]
    const isReply = replyText && replyText.trim() !== '';
    if (isReply) {
        const reply = replyText.replace(/^@\w+\s?/, '')
        if (reply.trim() !== '') {
            messages.push({ role: 'user', content: 'Reply: ' + reply})
        }else {
            messages.push({ role: 'user', content: 'Reply: Deploy a tick for this tweet.'})
        }
    }
    if (imageUrl) {
        messages.push({ role: 'user', content: [
            { type: "text", text: `Identify the content in the images, which can be used to assist in generating ticks and descriptions.
                    If the user explicitly states the need to use the images in the tweet, please write 'Use pic' in the logoPrompt field.
                    If you think the posted image can serve as a good sticker image, then please generate a prompt based on the image
            ` },
            { type: "image_url", image_url: { url: imageUrl } },
        ]})
    }
    
    const response = await openai.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages
    });
    console.log(response.choices[0].message.content as string);
    const res = (response.choices[0].message.content as string).replace('```json', '').replace('```', '').replace(/^\\boxed{\s*|\s*}$/g, '').trim();
    let result = JSON.parse(res);
    if (!result || !result.tick) {
        return;
    }
    let tick = result.tick;
    logger.debug(`Generated tick: ${tick}`);
    let ticks = [tick];
    let community = await checkTickExist(tick);

    // if (community && community.tick === tick && isReply) {
    //     logger.debug(`Tick ${tick} is already used. Generating a new tick...`);
    //     await newTiptagReply(tweetId!, tweetId!, `The tick ${tick} is already used. Please try a different tick.`, 1);
    //     return;
    // }

    while (community && (community.length > 0 
        || tick.toLowerCase() === 'tagai'
        || tick.toLowerCase() === 'tiptag'
        || tick.toLowerCase() === 'tagaidao'
        || tick.toLowerCase() === 'deploy')
        || !/^[a-zA-Z]+$/.test(tick)) {
        try {
            logger.debug(`Tick ${tick} is already used. Generating a new tick...`);
            const response = await openai.chat.completions.create({
                model: OPENROUTER_MODEL,
                messages: messages.concat([
                    { role: 'user', content: `The ticks ${ticks.join(',')} are already used. Please do not use these ticks. Please notify that the tick is case sensitive.` },
                ]),
            });
            const res = (response.choices[0].message.content as string).replace('```json', '').replace('```', '').replace(/^\\boxed{\s*|\s*}$/g, '').trim();
            result = JSON.parse(res);
            tick = result.tick;
            ticks.push(tick);
            community = await checkTickExist(tick);
        } catch (error) {
            logger.error(`Error generating tick: ${error}`);
        }
    }
    console.log(result);
    return result;
}

/**
 * Justice wheather the tweet is intent to deploy a meme coin or not.
 * @param text 
 */
export async function getIntent(text: string) {
    
}
