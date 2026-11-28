const assert = require("node:assert/strict");
const { readdirSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { createI18n } = require("vue-i18n");
const locales = require("../src/i18n/locales.json");
const english = require("../src/i18n/messages/en.json");

const supported = Object.keys(locales);
const messagesDirectory = path.resolve(__dirname, "../src/i18n/messages");
const messages = Object.fromEntries(
  supported.map((locale) => [locale, require(path.join(messagesDirectory, locale + ".json"))])
);

function placeholders(text) {
  return Array.from(text.matchAll(/\{([\w]+)\}/g), (match) => match[1]).sort();
}

test("each supported locale has a complete catalog with the same placeholders as English", () => {
  const expectedGroups = Object.keys(english).filter((group) => group !== "terminal");
  const i18n = createI18n({ legacy: false, locale: "en", fallbackLocale: false, messages });
  const fileNames = supported.map((locale) => locale + ".json").sort();
  assert.deepEqual(readdirSync(messagesDirectory).sort(), fileNames);

  for (const locale of supported) {
    const groups = locale === "en" ? Object.keys(english) : expectedGroups;
    assert.deepEqual(Object.keys(messages[locale]).sort(), [...groups].sort(), locale);
    i18n.global.locale.value = locale;

    for (const group of groups) {
      assert.deepEqual(Object.keys(messages[locale][group]).sort(), Object.keys(english[group]).sort());
      for (const [key, source] of Object.entries(english[group])) {
        const label = `${locale} ${group}.${key}`;
        const translated = messages[locale][group][key];
        assert.equal(typeof translated, "string", label);
        assert.ok(translated.trim(), label);
        assert.deepEqual(placeholders(translated), placeholders(source), label);

        const values = Object.fromEntries(placeholders(source).map((name) => [name, `[${name}]`]));
        const rendered = i18n.global.t(`${group}.${key}`, values);
        assert.equal(rendered, translated.replace(/\{([\w]+)\}/g, (_, name) => values[name]), label);
      }
    }
  }
});

test("normalizes Electron locale tags and falls back to English for unsupported languages", async () => {
  const { resolveLocale } = await import("../src/i18n/resolve-locale.mjs");
  for (const [locale, expected] of [
    ["es-MX", "es"], ["pt_br", "pt-BR"], ["fr-CA", "fr"], ["de-DE", "de"],
    ["pl-PL", "pl"], ["ko-KR", "ko"], ["zh-CN", "zh-Hans"], ["zh-Hans-SG", "zh-Hans"],
    ["zh-Hant", "en"], ["zh-TW", "en"], ["en-GB", "en"], ["ar-EG", "en"],
    ["", "en"], [null, "en"], ["not a locale", "en"],
  ]) {
    assert.equal(resolveLocale(locale, supported), expected, String(locale));
  }
});

test("AppX declares all translated locales and both English variants", () => {
  const config = require("../quasar.config.js")({});
  assert.deepEqual(config.electron.builder.appx.languages, [
    "en-GB", "en-US", ...supported.filter((locale) => locale !== "en"),
  ]);
});
