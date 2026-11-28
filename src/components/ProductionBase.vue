<template>
  <div class="row justify-center q-mt-sm">
    <q-toggle
      :label="$t('signing.production')"
      v-model="productionModeToggle"
      color="grey-9"
      keep-color
    />
  </div>

  <div v-if="productionModeToggle" class="column items-center">
    <div class="app-field q-mt-sm">
      <label class="app-field-label" for="unsigned-apk">{{ $t("signing.unsignedApk") }}</label>
      <q-input
        outlined
        readonly
        for="unsigned-apk"
        v-model="unsigned_apk_path"
        color="black"
        @click="selectUnsignedApkPath"
        @keydown.enter.prevent="selectUnsignedApkPath"
      />
    </div>
    <div class="app-field q-mt-sm">
      <label class="app-field-label" for="key-file">
        {{ $t("signing.keystore", { extension: ".jks" }) }}
      </label>
      <q-input
        outlined
        readonly
        for="key-file"
        v-model="key_path"
        color="black"
        @click="selectKeyPath"
        @keydown.enter.prevent="selectKeyPath"
      />
    </div>
    <div class="app-field q-mt-sm">
      <label class="app-field-label" for="output-folder">{{ $t("signing.output") }}</label>
      <q-input
        outlined
        readonly
        for="output-folder"
        v-model="output_path"
        color="black"
        @click="selectOutputPath"
        @keydown.enter.prevent="selectOutputPath"
      />
    </div>

    <q-btn
      rounded
      flat
      no-caps
      class="bg-orange q-mt-sm text-white app-action"
      :label="$t('signing.sign')"
      @click="createSignedAPK"
    />
  </div>
</template>

<script>
import { Notify } from "quasar";

export default {
  name: "ProductionBase",
  data() {
    return {
      productionModeToggle: false,
      unsigned_apk_path: "",
      key_path: "",
      output_path: "",
    };
  },
  methods: {
    async selectUnsignedApkPath() {
      const chosen = await window.AppWrapperAPI.openFileFolderSelector(
        ["apk"], this.$t("dialogs.chooseFile"), this.$t("dialogs.files")
      );
      if (chosen) this.unsigned_apk_path = chosen;
    },
    async selectKeyPath() {
      const chosen = await window.AppWrapperAPI.openFileFolderSelector(
        ["jks"], this.$t("dialogs.chooseFile"), this.$t("dialogs.files")
      );
      if (chosen) this.key_path = chosen;
    },
    async selectOutputPath() {
      const chosen = await window.AppWrapperAPI.openFileFolderSelector(
        undefined, this.$t("dialogs.chooseFolder")
      );
      if (chosen) this.output_path = chosen;
    },
    async createSignedAPK() {
      if (!this.key_path || !this.unsigned_apk_path || !this.output_path) {
        Notify.create(this.$t("signing.pathsRequired"));
        return;
      }

      try {
        await window.AppWrapperAPI.runSigningScript(
          this.unsigned_apk_path,
          this.key_path,
          this.output_path
        );
      } catch (error) {
        console.error(error);
        Notify.create({ message: this.$t("signing.signFailed"), type: "negative" });
      }
    },
  },
};
</script>
