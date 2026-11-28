<template>
  <q-btn
    rounded
    flat
    no-caps
    class="text-black q-ma-sm bg-grey-3 app-action"
    icon="key"
    :label="$t('signing.createKeyAction')"
    @click="createKeyToSignDialog = true"
  />

  <q-dialog v-model="createKeyToSignDialog" persistent>
    <q-card class="bg-grey-3 app-dialog">
      <q-card-section class="row items-center justify-between no-wrap q-pb-sm text-black">
        <h2 class="text-h6 q-my-none">{{ $t("signing.createKey") }}</h2>
        <q-btn flat round dense icon="close" :aria-label="$t('common.close')" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <label class="app-field-label" for="key-name">{{ $t("signing.keyName") }}</label>
        <q-input for="key-name" outlined v-model="key_name" color="black" />
        <label class="app-field-label q-mt-sm" for="key-validity">{{ $t("signing.validity") }}</label>
        <q-input for="key-validity" outlined type="number" v-model="key_validity" color="black" />
        <label class="app-field-label q-mt-sm" for="key-alias">{{ $t("signing.alias") }}</label>
        <q-input for="key-alias" outlined v-model="key_alias" color="black" />
      </q-card-section>
      <q-card-actions>
        <q-btn
          rounded
          flat
          no-caps
          class="q-ma-sm bg-grey-10 text-white app-action"
          :label="$t('signing.createKey')"
          @click="createKeyToSign"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { Notify } from "quasar";

export default {
  name: "CreateKeyToSign",
  data() {
    return {
      createKeyToSignDialog: false,
      key_name: "app-release-key",
      key_validity: 10000,
      key_alias: "my-alias",
    };
  },
  methods: {
    async createKeyToSign() {
      try {
        await window.AppWrapperAPI.runKeyCreationScriptForSign(
          this.key_name,
          this.key_validity,
          this.key_alias
        );
      } catch (error) {
        console.error(error);
        Notify.create({ message: this.$t("signing.keyFailed"), type: "negative" });
      }
    },
  },
};
</script>
