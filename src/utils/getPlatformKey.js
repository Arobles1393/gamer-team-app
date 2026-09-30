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
  // macOS y Linux cuentan como PC (algunos indies solo listan esas)
  if (name.includes("pc") || name === "macos" || name === "linux") {
    return "pc";
  }
  // RAWG no usa "Mobile": los juegos de celular vienen como iOS o Android
  if (name.includes("mobile") || name === "ios" || name === "android") {
    return "mobile";
  }
  return null;
};