export const getPlatformKey = (platform) => {
  const name = platform.toLowerCase();
  if (name.includes("xbox")) {
    return "xbox";
  }
  if (name.includes("playstation")) {
    return "playstation";
  }
  if (name.includes("switch")) {
    return "switch";
  }
  if (name.includes("pc")) {
    return "pc";
  }
  if (name.includes("mobile")) {
    return "mobile";
  }
  return null;
};