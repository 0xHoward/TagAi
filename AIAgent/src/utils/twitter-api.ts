import { Client } from "twitter-api-sdk";
import log4js from "./logger.ts";
import { TwitterConfig } from "../plugins/types.ts";
import redis from "../db/redis.ts";
import redisConfig from "../config/redis.ts";
import { refreshAgentToken } from "./api.ts";

const logger = log4js.getLogger("tweet");

class TwitterApi {
  twitterId: string;
  twitterConfig: TwitterConfig;

  constructor(twitterId: string) {
    this.twitterId = twitterId;
  }

  async getClient() {
    if (!this.twitterConfig) {
        // get from redis
        const token = await redis.get(redisConfig.UserAuthKeyPre + this.twitterId);
        if (!token) {
            throw new Error("Token not found");
        }
        this.twitterConfig = {
            access_token: token,
            expires_at: 0,
            twitter_id: this.twitterId,
        }
    }
    if (this.twitterConfig.expires_at < Date.now()) {
        // refresh token
        let token: any = await refreshAgentToken(this.twitterId);
        if (!token) {
            throw new Error("Failed to refresh token");
        }
        this.twitterConfig = {
            access_token: token.access_token,
            expires_at: token.expires_at,
            twitter_id: this.twitterId,
        }
    }
    return new Client(this.twitterConfig.access_token);
  }

  async userLike(tweetId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const client = await this.getClient();
        const result = await client.tweets.usersIdLike(this.twitterId, {
          tweet_id: tweetId,
        });
        if (result && result.data) {
          return resolve(result.data);
        }
        return resolve(false);
      } catch (e) {
        logger.error("userLike error", e);
        if (
          e.error?.errors &&
          e.error.errors.length > 0 &&
          e.error.errors[0].message === "This tweet cannot be found."
        ) {
          throw e;
        }

        if (e.error?.status === 401) {
          throw e;
        }
        resolve(false);
      }
    });
  }

  async userRetweet(tweetId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const client = await this.getClient();
        const result = await client.tweets.usersIdRetweets(this.twitterId, {
          tweet_id: tweetId,
        });
        if (result && result.data) {
          return resolve(result.data);
        }
        logger.error("Retweet fail:", result);
        return resolve(false);
      } catch (e) {
        logger.error("Retweet fail:", e);
        if (
          e.error?.errors &&
          e.error.errors.length > 0 &&
          e.error.errors[0].message === "This tweet cannot be found."
        ) {
          throw e;
        }
        if (e.error?.status === 401) {
          throw e;
        }
        resolve(false);
      }
    });
  }

  async userTweet(text: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const client = await this.getClient();
        const result = await client.tweets.createTweet({
          text,
        });
        if (result && result.data) {
          return resolve(result.data);
        }
        return resolve(false);
      } catch (e) {
        logger.error("userTweet error", e);
        if (e.error?.status === 401) {
          throw e;
        }
        resolve(false);
      }
    });
  }

  async userQuoteTweet(tweetId: string, text: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const client = await this.getClient();
        const result = await client.tweets.createTweet({
          text,
          quote_tweet_id: tweetId,
        });
        if (result && result.data) {
          return resolve(result.data);
        }
        logger.error("user quote tweet fail:", result);
        return reject(result);
      } catch (e) {
        logger.error("user quote tweet fail:", e);
        if (
          e.error?.errors &&
          e.error.errors.length > 0 &&
          e.error.errors[0].message === "This tweet cannot be found."
        ) {
          throw e;
        }
        if (e.error?.status === 401) {
          throw e;
        }
        reject(e);
      }
    });
  }

  async userReply(tweetId: string, text: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const client = await this.getClient();
        const result = await client.tweets.createTweet({
          reply: {
            in_reply_to_tweet_id: tweetId,
          },
          text,
        });
        if (result && result.data) {
          return resolve(result.data);
        }
        return resolve(false);
      } catch (e) {
        if (
          e.error?.errors &&
          e.error.errors.length > 0 &&
          e.error.errors[0].message === "This tweet cannot be found."
        ) {
          throw e;
        }
        if (e.error?.status === 401) {
          throw e;
        }
        logger.error("userReply error", e);
        resolve(false);
      }
    });
  }
}

export default TwitterApi;
