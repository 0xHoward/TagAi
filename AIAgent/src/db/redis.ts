// @ts-nocheck
import log4js from '../utils/logger.ts'
import redis from 'redis'
import envConfig from '../config/fromEnv.ts'
import ConstantNumber from '../config/redis.ts'
import _ from 'lodash'

const logger = log4js.getLogger('db')

const REDIS_HOST = "localhost";
const REDIS_PORT = "6379";
const REDIS_KEY = "RedisPrimaryKey";

// var client = redis.createClient({
//   url: `redis://:${envConfig.REDIS_PWD}@${REDIS_HOST}:${REDIS_PORT}`
// });

var client = redis.createClient(REDIS_PORT, REDIS_HOST)
client.connect();

let connectTime = 0;

client.on("connect", function () {
  logger.info("Connected to the Redis.");
}).on("error", function (err) { console.error("Connect to the Redis failed.", err); 
  if (connectTime++ == 20) {
    process.exit()
  }
 });

export default {
  /**
   * Get the primary key of redis.
   * @returns An integer number.
   */
  getKey: async () => {
    let key;
    try {
      key = await client.incr(REDIS_KEY);
    } catch (error) {
      console.error("Get the primary key failed", error);
      throw error;
    }
    return key;
  },

  incrKey: async (key) => {
    try {
      return await client.incr(key)
    } catch (e) {
      console.error("Get the primary key failed", error);
      throw error;
    }
  },

  decrKey: async (key) => {
    try {
      return await client.decr(key)
    } catch (e) {
      console.error("Get the primary key failed", error);
      throw error;
    }
  },

  get: async (key) => {
    return await client.get(key)
  },

  set: async (key, value, needExpire: boolean | number = true) => {
    try {
      await client.set(key, value);
      if (needExpire) {
        if (typeof (needExpire) === 'number') {
          await client.expire(key, needExpire);
        } else {
          await client.expire(key, ConstantNumber.REDIS_EXPIRE_TIME);
        }
      }
    } catch (error) {
      console.error(`Set value into Redis failed. Key: ${key}, Value: ${value}`);
      throw error;
    }
    return;
  },

  del: async (key) => {
    try {
      await client.del(key);
    } catch (error) {
      console.error(`Delete the key[${key}] from Redis failed.`);
      throw error;
    }
    return;
  },

  llen: async (key) => {
    try {
      return client.LLEN(key);
    } catch (e) {

    }
  },

  lrange: async (key, n) => {
    const data = await client.lRange(key, 0, n - 1);
    await client.lTrim(key, n, -1)
    return data
  },

  rPush: (key, value) => {
    try {
      client.rPush(key, value);
    } catch (error) {
      console.error(`rPush the key[${key}] from Redis failed.`);
      throw error;
    }
  },

  lPop: async (key) => {
    try {
      return await client.lPop(key);
    } catch (error) {
      logger.error(`lPop the key[${key}] from Redis failed.`);
      throw error;
    }
  },

  sadd: async (key, ...value) => {
    try {
      await client.sAdd(key, value);
    } catch (error) {
      logger.error(`sadd the key[${key}] from Redis failed.`, error);
    }
  },

  smembers: async (key) => {
    try {
      const members = await client.sMembers(key);
      return members
    } catch (error) {
      logger.error(`smembers the key[${key}] from Redis failed.`, error);
    }
  },

  zAdd: async (key, score, value) => {
    try {
      await client.zAdd(key, { score, value });
    } catch (error) {
      logger.error(`zAdd the key[${key}] from Redis failed.`, error);
    }
  },

  getByPattern: async (pattern, callback) => {
    let cursor = '0';
    do {
      const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = newCursor;
      if (keys.length > 0) {
        const values = await client.mGet(keys);
        await callback(_.zipObject(keys, values));
      }
    } while (cursor !== '0');
  },

  deleteKeysByPattern: async (pattern) => {
    let cursor = '0';
    do {
      const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 300);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } while (cursor !== '0');
  }
}