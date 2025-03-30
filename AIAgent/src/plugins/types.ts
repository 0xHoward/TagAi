import { Tweet } from "agent-twitter-client";

export type TwitterConfig = {
    access_token: string;
    expires_at: number;
    twitter_id: string;
}

export type TwitterProfile = {
    id: string;
    username: string;
    name: string;
    followersCount: number;
    followingCount: number;
    createdAt: string;
};

export type TagAiTweet = Tweet & {
    dbId?: number | string;
};

export type Prompt = {
    /** Character biography */
    bio: string | string[];
    /** Character background lore */
    lore: string[];
    /** Known topics */
    topics: string[];
    /** Character traits */
    adjectives: string[];
    /** Optional knowledge base */
    knowledge?: string[];
    /** Writing style guides */
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };
    /** Optional Twitter profile */
    twitterProfile?: {
        id: string;
        username: string;
        screenName: string;
        bio: string;
        nicknames?: string[];
    };
};