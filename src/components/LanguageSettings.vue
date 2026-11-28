<template>
  <div class="row justify-end">
    <q-btn
      flat
      no-caps
      icon="settings"
      :label="t('settings.title')"
      @click="showSettings = true"
    />
  </div>

  <q-dialog v-model="showSettings">
    <q-card class="app-dialog">
      <q-card-section class="row items-center justify-between no-wrap">
        <h2 class="text-h6 q-my-none">{{ t("settings.title") }}</h2>
        <q-btn flat round dense icon="close" :aria-label="t('common.close')" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <label class="app-field-label" for="app-language">{{ t("settings.language") }}</label>
        <q-select
          for="app-language"
          outlined
          emit-value
          map-options
          :model-value="languagePreference"
          :options="options"
          @update:model-value="setLanguagePreference"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n/dist/vue-i18n.esm-bundler.js";
import { languageOptions, languagePreference, setLanguagePreference } from "../boot/i18n";

const { t } = useI18n({ useScope: "global" });
const showSettings = ref(false);
const options = computed(() => [
  { label: t("settings.system"), value: "system" },
  ...languageOptions,
]);
</script>
