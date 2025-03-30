import {
    parseBooleanFromText,
    IAgentRuntime,
    ActionTimelineType,
} from "@elizaos/core";
import { z, ZodError } from "zod";
import { getProfileByAgentName } from "../db/apis/agent.ts";
import { decrypt } from "../utils/encode.ts";
import fromEnv from "../config/fromEnv.ts";

export const DEFAULT_MAX_TWEET_LENGTH = 260;

const twitterUsernameSchema = z
    .string()
    .min(1, "An X/Twitter Username must be at least 1 character long")
    .max(15, "An X/Twitter Username cannot exceed 15 characters")
    .refine((username) => {
        // Allow wildcard '*' as a special case
        if (username === "*") return true;

        // Twitter usernames can:
        // - Start with digits now
        // - Contain letters, numbers, underscores
        // - Must not be empty
        return /^[A-Za-z0-9_]+$/.test(username);
    }, "An X Username can only contain letters, numbers, and underscores");

/**
 * This schema defines all required/optional environment settings,
 * including new fields like TWITTER_SPACES_ENABLE.
 */
export const twitterEnvSchema = z.object({
    TWITTER_DRY_RUN: z.boolean(),
    TWITTER_ID: z.string().min(1, "X/Twitter ID is required"),
    TWITTER_USERNAME: z.string().min(1, "X/Twitter username is required"),
    TWITTER_PASSWORD: z.string().min(1, "X/Twitter password is required"),
    TWITTER_EMAIL: z.string().email("Valid X/Twitter email is required"),
    TICK: z.string(),
    DEFAULT_TAG: z.string(),
    MAX_TWEET_LENGTH: z.number().int().default(DEFAULT_MAX_TWEET_LENGTH),
    TWITTER_SEARCH_ENABLE: z.boolean().default(false),
    TWITTER_2FA_SECRET: z.string(),
    TWITTER_RETRY_LIMIT: z.number().int(),
    TWITTER_POLL_INTERVAL: z.number().int(),
    TWITTER_TARGET_USERS: z.array(twitterUsernameSchema).default([]),
    // I guess it's possible to do the transformation with zod
    // not sure it's preferable, maybe a readability issue
    // since more people will know js/ts than zod
    /*
        z
        .string()
        .transform((val) => val.trim())
        .pipe(
            z.string()
                .transform((val) =>
                    val ? val.split(',').map((u) => u.trim()).filter(Boolean) : []
                )
                .pipe(
                    z.array(
                        z.string()
                            .min(1)
                            .max(15)
                            .regex(
                                /^[A-Za-z][A-Za-z0-9_]*[A-Za-z0-9]$|^[A-Za-z]$/,
                                'Invalid Twitter username format'
                            )
                    )
                )
                .transform((users) => users.join(','))
        )
        .optional()
        .default(''),
    */
    POST_INTERVAL_MIN: z.number().int(),
    POST_INTERVAL_MAX: z.number().int(),
    ENABLE_ACTION_PROCESSING: z.boolean(),
    ACTION_INTERVAL: z.number().int(),
    POST_IMMEDIATELY: z.boolean(),
    TWITTER_SPACES_ENABLE: z.boolean().default(false),
    MAX_ACTIONS_PROCESSING: z.number().int(),
    ACTION_TIMELINE_TYPE: z
        .nativeEnum(ActionTimelineType)
        .default(ActionTimelineType.Following),
});

export type TwitterConfig = z.infer<typeof twitterEnvSchema>;

/**
 * Helper to parse a comma-separated list of Twitter usernames
 * (already present in your code).
 */
function parseTargetUsers(targetUsersStr?: string | null): string[] {
    if (!targetUsersStr?.trim()) {
        return [];
    }
    return targetUsersStr
        .split(",")
        .map((user) => user.trim())
        .filter(Boolean);
}

function safeParseInt(
    value: string | undefined | null,
    defaultValue: number
): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : Math.max(1, parsed);
}

/**
 * Validates or constructs a TwitterConfig object using zod,
 * taking values from the IAgentRuntime or process.env as needed.
 */
// This also is organized to serve as a point of documentation for the client
// most of the inputs from the framework (env/character)

// we also do a lot of typing/parsing here
// so we can do it once and only once per character
export async function validateTwitterConfig(
    runtime: IAgentRuntime
): Promise<TwitterConfig> {
    try {
        const profile = await getProfileByAgentName(runtime.character.name);
        if (!profile?.twitterId) {
            throw new Error("Profile not found");
        }
        const twitterConfig = {
            TWITTER_DRY_RUN:
                parseBooleanFromText(
                    runtime.getSetting("TWITTER_DRY_RUN") ||
                        fromEnv.TWITTER_DRY_RUN
                ) ?? false, // parseBooleanFromText return null if "", map "" to false

            TWITTER_ID:
                runtime.getSetting("TWITTER_ID") ||
                profile?.twitterId,

            TWITTER_USERNAME:
                runtime.getSetting("TWITTER_USERNAME") ||
                profile?.username,

            TWITTER_PASSWORD:
                runtime.getSetting("TWITTER_PASSWORD") ||
                decrypt(profile?.password,
                    fromEnv.ENCODE_KEY,
                    fromEnv.ENCODE_IV
                ),

            TICK: runtime.getSetting("TICK") || profile?.tick,

            DEFAULT_TAG: runtime.getSetting("DEFAULT_TAG") || fromEnv.TAGAI_TAG,

            TWITTER_EMAIL:
                runtime.getSetting("TWITTER_EMAIL") ||
                profile?.email,

            // number as string?
            MAX_TWEET_LENGTH: safeParseInt(
                runtime.getSetting("MAX_TWEET_LENGTH"),
                DEFAULT_MAX_TWEET_LENGTH
            ),

            TWITTER_SEARCH_ENABLE:
                parseBooleanFromText(
                    runtime.getSetting("TWITTER_SEARCH_ENABLE") ||
                        fromEnv.TWITTER_SEARCH_ENABLE
                ) ?? false,

            // string passthru
            TWITTER_2FA_SECRET:
                runtime.getSetting("TWITTER_2FA_SECRET") ||
                profile?.secret2fa
                ||
                "",

            // int
            TWITTER_RETRY_LIMIT: safeParseInt(
                runtime.getSetting("TWITTER_RETRY_LIMIT") ||
                    fromEnv.TWITTER_RETRY_LIMIT,
                5
            ),

            // int in seconds
            TWITTER_POLL_INTERVAL: safeParseInt(
                runtime.getSetting("TWITTER_POLL_INTERVAL") ||
                    fromEnv.TWITTER_POLL_INTERVAL,
                120 // 2m
            ),

            // comma separated string
            TWITTER_TARGET_USERS: parseTargetUsers(
                runtime.getSetting("TWITTER_TARGET_USERS") ||
                    fromEnv.TWITTER_TARGET_USERS
            ),

            // int in minutes
            POST_INTERVAL_MIN: safeParseInt(
                runtime.getSetting("POST_INTERVAL_MIN") ||
                    fromEnv.POST_INTERVAL_MIN,
                180 // 3 hours
            ),

            // int in minutes
            POST_INTERVAL_MAX: safeParseInt(
                runtime.getSetting("POST_INTERVAL_MAX"),
                360 // 6 hours
            ),

            // bool
            ENABLE_ACTION_PROCESSING:
                parseBooleanFromText(
                    runtime.getSetting("ENABLE_ACTION_PROCESSING")
                ) ?? false,

            // init in minutes (min 1m)
            ACTION_INTERVAL: safeParseInt(
                runtime.getSetting("ACTION_INTERVAL"),
                5 // 5 minutes
            ),

            // bool
            POST_IMMEDIATELY:
                parseBooleanFromText(
                    runtime.getSetting("POST_IMMEDIATELY") ||
                        fromEnv.POST_IMMEDIATELY
                ) ?? false,

            TWITTER_SPACES_ENABLE:
                parseBooleanFromText(
                    runtime.getSetting("TWITTER_SPACES_ENABLE") ||
                        fromEnv.TWITTER_SPACES_ENABLE
                ) ?? false,

            MAX_ACTIONS_PROCESSING: safeParseInt(
                runtime.getSetting("MAX_ACTIONS_PROCESSING") ||
                    fromEnv.MAX_ACTIONS_PROCESSING,
                1
            ),

            ACTION_TIMELINE_TYPE:
                runtime.getSetting("ACTION_TIMELINE_TYPE") ||
                fromEnv.ACTION_TIMELINE_TYPE,
        };

        return twitterEnvSchema.parse(twitterConfig);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `X/Twitter configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
