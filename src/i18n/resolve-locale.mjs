export function resolveLocale(value, supported) {
  if (typeof value !== "string" || !value.trim()) return "en";

  try {
    const { baseName, language, script, region } = new Intl.Locale(
      value.trim().replace(/_/g, "-")
    );
    if (supported.includes(baseName)) return baseName;
    if (supported.includes(language)) return language;
    if (language === "pt") return "pt-BR";
    if (
      language === "zh" &&
      (script === "Hans" || (!script && !["TW", "HK", "MO"].includes(region)))
    ) {
      return "zh-Hans";
    }
  } catch {
    // Electron can return an empty or unrecognized locale.
  }
  return "en";
}
