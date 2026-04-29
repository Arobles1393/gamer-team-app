export const getPlatform = (url) => {
    if (url.includes("steam")) return "steam";
    if (url.includes("discord")) return "discord";
    if (url.includes("xbox")) return "xbox";
    if (url.includes("playstation") || url.includes("psn")) return "playstation";
    if (url.includes("epicgames")) return "epicgames";
    if (url.includes("nintendo")) return "nintendo";
    if (url.includes("facebook")) return "facebook";
    if (url.includes("instagram")) return "instagram";
    if (url.includes("x.com")) return "x";
    if (url.includes("tiktok")) return "tiktok";
    if (url.includes("youtube")) return "youtube";
    if (url.includes("threads")) return "threads";
    if (url.includes("snapchat")) return "snapchat";
    if (url.includes("twitch")) return "twitch";
    if (url.includes("4chan")) return "fchan";
    if (url.includes("reddit")) return "reddit";
    return "other";
};