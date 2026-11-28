import { boot } from "quasar/wrappers";
import { LocalStorage } from "quasar";
import { ref } from "vue";
import { createI18n } from "vue-i18n/dist/vue-i18n.esm-bundler.js";
import en from "quasar/lang/en-US";
import es from "quasar/lang/es";
import ptBR from "quasar/lang/pt-BR";
import fr from "quasar/lang/fr";
import de from "quasar/lang/de";
import it from "quasar/lang/it";
import nl from "quasar/lang/nl";
import pl from "quasar/lang/pl";
import tr from "quasar/lang/tr";
import ru from "quasar/lang/ru";
import ja from "quasar/lang/ja";
import ko from "quasar/lang/ko-KR";
import zhHans from "quasar/lang/zh-CN";
import id from "quasar/lang/id";
import hi from "quasar/lang/hi";
import locales from "../i18n/locales.json";
import { resolveLocale } from "../i18n/resolve-locale.mjs";

const storageKey = "languagePreference";
const supportedLocales = Object.keys(locales);
const quasarLanguages = {
  en, es, "pt-BR": ptBR, fr, de, it, nl, pl, tr, ru, ja, ko, "zh-Hans": zhHans, id, hi,
};
const messages = Object.fromEntries(
  Object.entries(import.meta.globEager("../i18n/messages/*.json")).map(([file, module]) => [
    file.split("/").pop().slice(0, -5), module.default,
  ])
);
const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: "en",
  fallbackLocale: "en",
  messages,
});

export const languageOptions = Object.entries(locales).map(([value, label]) => ({ label, value }));
export const languagePreference = ref("system");
let systemLanguage = "en";
let quasar;

function applyLanguage() {
  const locale = languagePreference.value === "system" ? systemLanguage : languagePreference.value;
  i18n.global.locale.value = locale;
  quasar.lang.set(quasarLanguages[locale]);
  document.documentElement.lang = locale;
}

export function setLanguagePreference(value) {
  if (value === "system") {
    LocalStorage.remove(storageKey);
  } else if (supportedLocales.includes(value)) {
    LocalStorage.set(storageKey, value);
  } else {
    return;
  }
  languagePreference.value = value;
  applyLanguage();
}

export function terminalText(key, params = {}) {
  return i18n.global.t(`terminal.${key}`, params, { locale: "en" });
}

export default boot(async ({ app }) => {
  try {
    systemLanguage = resolveLocale(
      await window.AppWrapperAPI?.getLocale(), supportedLocales
    );
  } catch {
    systemLanguage = "en";
  }

  const saved = LocalStorage.getItem(storageKey);
  languagePreference.value = supportedLocales.includes(saved) ? saved : "system";
  quasar = app.config.globalProperties.$q;
  app.use(i18n);
  applyLanguage();
});
