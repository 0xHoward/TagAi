import {
  Action,
  ActionExample,
  Memory,
  State,
  composeContext,
  generateTrueOrFalse,
  ModelClass,
  HandlerCallback,
  generateText,
  elizaLogger
} from "@elizaos/core";
import DeEvoAgent from "../../DeEvoAgent.ts";
import { getTweetCurationById, newCurate } from "../../db/apis/tweet.ts";
import { getBalance } from "../../utils/ethers.ts";
import { ethers } from "ethers";
import fromEnv from "../../config/fromEnv.ts";
import { getUserVPOPByTwitterId } from "../../db/apis/user.ts";

const shouldCurateTemplate = `# Areas of Expertise
{{knowledge}}
# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{providers}}

# Task: Decide if {{agentName}} should curate the tweet.
{{agentName}} is bref, and doesn't want to be annoying. {{agentName}} will only curate the tweet most greatfull/interesting/helpfull for \${{tick}}.
Consider the balance of {{agentName}}'s VP, now {{agentName}} has {{vp}} VP.
The more VP {{agentName}} have, the more likely to curate. A suitable VP balance is approximately from 100 to 150.

Tweet:
{{currentTweet}}`;

const curateVPTemplate = `# Task: Decide how many VP should {{agentName}} cost to curate the tweet.
Tweet:
{{currentTweet}}

{{providers}}

You should return a number between 1 and 10 only. The larger number means the tweet is more worthy to curate.
The response should be in the format like "10".
`

export default {
  name: "CURATE",
  description: "Curate tweet for reward",
  similes: ["CURATE_TWEET", "CURATION", "CURATE_CONTENT", "TWEET_CURATION"],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "${{tick}} is wonderfull, I like it!",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "",
          action: "CURATE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What a great ${{tick}}. Let's hold a little longer. It will fly to the moon.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "",
          action: "CURATE",
        },
      },
    ],
    ,
    [
      {
        user: "{{user1}}",
        content: {
          text: "Hi {{agentName}}, this is the form of ${{tick}} that is liked by children and adults.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "CURATE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the wheather today?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Fuck! ${{tick}} is so bad!",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "",
        },
      },
    ],
  ],
  validate: async (_runtime: DeEvoAgent, _message: Memory, _state: State) => {
    if (_message?.content?.action?.toLowerCase() === "curate") {
      //  Determine whether the target tweet is in the database
      const tweetCuration = await getTweetCurationById(
        _state.tweetId as string
      );

      if (tweetCuration.tick !== _runtime.tick) {
        return false;
      }

      if (!ethers.isAddress(_runtime.ethAddress)) return false;

      // get balance
      const balance = await getBalance(_runtime.ethAddress, _runtime.clients.twitter.contract, fromEnv.CHAIN_PRE)
      if (balance < 10000) return false;

      let userInfo = await getUserVPOPByTwitterId(_runtime.clients.twitter.profile.id)
      // calculate the vp of the user
      userInfo.vp = userInfo.vp + (Date.now() - userInfo.lastUpdateVpStamp) / 1000 / 86400 / 3 * 200;
      userInfo.vp = Math.min(userInfo.vp, 200);
      if (userInfo.vp < 10) return false;

      const context = composeContext({
        state: {
          ..._state,
          tick: _runtime.tick,
          vp: userInfo.vp,
        },
        template: shouldCurateTemplate,
        templatingEngine: "handlebars",
      });

      const shouldCurate = await generateTrueOrFalse({
        runtime: _runtime,
        context,
        modelClass: ModelClass.SMALL,
      });
      return shouldCurate;
    }
    return false;
  },
  handler: async (
    _runtime: DeEvoAgent,
    _message: Memory,
    _state: State,
    _options: any,
    _callback: HandlerCallback
  ) => {
    const tweetId = _state.tweetId;

    if (!tweetId) {
        return;
    }
    const context = composeContext({
        state: {
            ..._state,
            tick: _runtime.tick,
            currentTweet: _message.content?.text,
        },
        template: curateVPTemplate,
        templatingEngine: "handlebars"
    });
    let vp: string | number | undefined = await generateText({
        runtime: _runtime,
        context,
        modelClass: ModelClass.SMALL,
    });

    try {
        vp = parseInt(vp);
        if (vp > 0 && vp < 11) {
            const curated = await newCurate(tweetId as string, _state.twitterId as string, _runtime.tick, vp)
            if (_callback && curated) {
                _callback({
                    text: 'Curated successfully',
                    action: 'CURATE',
                    vp
                })
                return;
            }
            elizaLogger.error('curate failed', curated);
        }
        elizaLogger.info('generate wrong value vp', vp);
    } catch (error) {
        elizaLogger.error('generate wrong format vp or curate failed', error);
    }
  },
} as Action;
