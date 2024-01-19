<template>
  <div class="row justify-center q-mt-sm">
    <q-toggle
      label="Production"
      v-model="productionModeToggle"
      color="grey-9"
      keep-color
    />
  </div>

  <div v-if="productionModeToggle">
    <div class="row justify-center q-mt-sm">
      <q-input
        outlined
        readonly
        v-model="unsigned_apk_path"
        label="Click to select unsigned apk"
        color="black"
        style="width: 60vw; min-width: 250px"
        @click="selectUnsignedApkPath"
      />
    </div>
    <div class="row justify-center q-mt-sm">
      <q-input
        outlined
        readonly
        v-model="key_path"
        label="Click to select key file (.jks)"
        color="black"
        style="width: 60vw; min-width: 250px"
        @click="selectKeyPath"
      />
    </div>
    <div class="row justify-center q-mt-sm">
      <q-input
        outlined
        readonly
        v-model="output_path"
        label="Click to select output path"
        color="black"
        style="width: 60vw; min-width: 250px"
        @click="selectOutputPath"
      />
    </div>

    <div class="row justify-center q-mt-sm">
      <q-btn
        rounded
        flat
        class="bg-orange q-mx-sm text-white"
        @click="createSignedAPK"
        >Sign</q-btn
      >
    </div>
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
      this.unsigned_apk_path =
        await window.AppWrapperAPI.openFileFolderSelector(["apk"]);
    },
    async selectKeyPath() {
      this.key_path = await window.AppWrapperAPI.openFileFolderSelector([
        "jks",
      ]);
    },
    async selectOutputPath() {
      this.output_path = await window.AppWrapperAPI.openFileFolderSelector();
    },
    async createSignedAPK() {
      if (!this.key_path || !this.unsigned_apk_path || !this.output_path) {
        Notify.create("⚠️ Missing required path(s)");
        return;
      }

      await window.AppWrapperAPI.runSigningScript(
        this.unsigned_apk_path,
        this.key_path,
        this.output_path
      );
    },
  },
};
</script>
