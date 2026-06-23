import { countries, getEmojiFlag, type TCountryCode } from "countries-list";

const nameToCode = new Map<string, string>(
  Object.entries(countries).map(([code, data]) => [data.name, code]),
);

export function getCountryFlag(countryName: string): string {
  const code = nameToCode.get(countryName);
  return code ? getEmojiFlag(code as TCountryCode) : "🌍";
}
