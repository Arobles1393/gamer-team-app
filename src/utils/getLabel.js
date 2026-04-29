export const getLabel = (platform) => {
    switch (platform) {
        case "steam": return "Steam";
        case "discord": return "Discord";
        case "xbox": return "Xbox";
        case "playstation": return "PlayStation";
        case "epicgames": return "Epic Games"
        case "nintendo": return "Nintendo"
        case "facebook": return "Facebook"
        case "instagram": return "Instagram"
        case "x": return "X"
        case "tiktok": return "Tiktok"
        case "youtube": return "Youtube"
        case "threads": return "Threads"
        case "snapchat": return "Snapchat"
        case "twitch": return "Twitch"
        case "fchan": return "4chan"
        case "reddit": return "Reddit"
        default: return "Perfil";
    }
};