<template>
  <q-page class="q-pa-md">
    <LanguageSettings />

    <div class="column items-center">
      <q-toggle
        :label="$t('project.source')"
        v-model="use_website"
        color="grey-9"
        keep-color
      />
      <div class="app-field">
        <label class="app-field-label" for="project-source">
          {{ $t(use_website ? "project.websiteUrl" : "project.directoryPath") }}
        </label>
        <q-input
          outlined
          for="project-source"
          v-model="website_input"
          :readonly="!use_website"
          color="black"
          @click="openDirectorySelector"
          @keydown.enter.prevent="openDirectorySelector"
        />
      </div>
      <div class="app-field q-mt-sm">
        <label class="app-field-label" for="app-id">
          {{ $t("project.appId", { example: "com.website.app" }) }}
        </label>
        <q-input outlined for="app-id" v-model="app_id_input" color="black" />
      </div>
      <div class="app-field q-mt-sm">
        <label class="app-field-label" for="app-name">{{ $t("project.appName") }}</label>
        <q-input outlined for="app-name" v-model="app_name_input" color="black" />
      </div>
      <div class="app-field q-mt-sm">
        <label class="app-field-label" for="target-sdk">
          {{ $t("project.targetSdk", { example: 33 }) }}
        </label>
        <q-input
          outlined
          for="target-sdk"
          type="number"
          v-model="target_sdk_version_input"
          color="black"
        />
      </div>
      <q-toggle
        class="q-mt-sm"
        :label="$t('project.overwriteSdk')"
        v-model="overwrite_settings"
        color="grey-9"
        keep-color
      />
    </div>

    <p class="text-subtitle2 text-center q-mt-md">
      {{ $t("project.imageHint", { iconSize: "1024px x 1024px", splashSize: "2732px x 2732px" }) }}
    </p>
    <div class="row justify-center q-gutter-md q-mb-md">
      <div v-for="(img, index) in selectedImages" :key="imageLabels[index]" class="image-slot">
        <q-img
          :src="img.data"
          :alt="$t(imageLabels[index])"
          :aria-label="$t(imageLabels[index])"
          role="button"
          tabindex="0"
          class="image-preview"
          @click="addImage(index)"
          @keydown.enter.prevent="addImage(index)"
          @keydown.space.prevent="addImage(index)"
        >
          <template #default v-if="!img.data">
            <div class="absolute-full column flex-center bg-grey-9 text-white">
              <q-icon name="add" size="md" />
            </div>
          </template>
          <q-tooltip v-if="img.path">{{ $t(imageLabels[index]) }}</q-tooltip>
        </q-img>
        <q-btn
          color="grey-9"
          dense
          round
          icon="info"
          class="image-info"
          :aria-label="$t('project.imageDetails', { image: $t(imageLabels[index]) })"
        >
          <q-popup-proxy>
            <q-banner>{{ img.path || $t("common.notSelected") }}</q-banner>
          </q-popup-proxy>
        </q-btn>
        <p class="image-caption text-black q-mb-none q-pt-xs">
          {{ img.path ? img.path.split(/[\\/]/).pop() : $t(imageLabels[index]) }}
        </p>
      </div>
    </div>

    <q-dialog v-model="terminalProcessDialog" persistent @show="openTerminal" @hide="disposeTerminal">
      <q-card class="terminal-card bg-black">
        <q-card-section class="row items-center justify-between no-wrap q-pb-sm text-white">
          <div class="text-h6">{{ terminalText("title") }}</div>
          <q-btn
            icon="close"
            flat
            round
            dense
            :aria-label="$t('common.close')"
            @click="closeTerminal"
          />
        </q-card-section>
        <q-separator dark />
        <q-card-section class="terminal-output q-pt-sm">
          <div ref="terminalOutput"></div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <div class="row justify-center q-gutter-sm">
      <q-btn
        v-if="!first_build"
        rounded
        flat
        no-caps
        class="bg-purple text-white app-action"
        :label="$t('project.build')"
        @click="createBuildFromURL()"
      />
      <q-btn
        rounded
        flat
        no-caps
        class="bg-purple-9 text-white app-action"
        :label="$t('project.cleanBuild')"
        @click="createBuildFromURL(null, 'clean')"
      />
      <q-btn
        rounded
        flat
        no-caps
        class="bg-grey-3 text-black app-action"
        :label="$t('project.test')"
        @click="createBuildFromURL('fortest')"
      />
    </div>
    <ProductionBase />
    <div class="row justify-center q-mt-md q-gutter-sm">
      <q-btn
        v-for="item in actions"
        :key="item.label"
        rounded
        flat
        no-caps
        class="text-black bg-grey-3 app-action"
        :icon="item.icon"
        :label="$t(item.label)"
        @click="item.run"
      />
      <CreateKeyToSign />
    </div>
  </q-page>
</template>

<style scoped>
.image-slot {
  position: relative;
  width: 7rem;
}

.image-preview {
  width: 100%;
  height: 7rem;
  cursor: pointer;
}

.image-info {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}

.image-caption {
  overflow-wrap: anywhere;
}

.terminal-card {
  max-width: calc(100vw - 2rem);
}

.terminal-output {
  overflow-x: auto;
}
</style>

<script>
import { defineComponent, markRaw } from "vue";
import { Loading, LocalStorage, Notify } from "quasar";
import { Terminal } from "xterm";
import { terminalText } from "../boot/i18n";
import ProductionBase from "components/ProductionBase.vue";
import CreateKeyToSign from "components/CreateKeyToSign.vue";
import LanguageSettings from "components/LanguageSettings.vue";

const imageLabels = [
  "project.iconOnly",
  "project.iconForeground",
  "project.iconBackground",
  "project.splash",
  "project.splashDark",
];

function imageSlots(saved) {
  return imageLabels.map((_, index) => ({
    data: saved?.[index]?.data || "",
    path: saved?.[index]?.path || "",
  }));
}

export default defineComponent({
  name: "IndexPage",
  components: { ProductionBase, CreateKeyToSign, LanguageSettings },
  data() {
    return {
      use_website: true,
      website_input: "",
      app_id_input: "",
      app_name_input: "",
      target_sdk_version_input: 33,
      overwrite_settings: true,
      imageLabels,
      selectedImages: imageSlots(LocalStorage.getItem("selectedImages")),
      terminalProcessDialog: false,
      terminalInstance: null,
      terminalLogs: "",
      terminalTimer: null,
      liveTerminal: false,
      first_build: !LocalStorage.getItem("after_first_build"),
      actions: [
        { label: "project.install", icon: "content_copy", run: () => this.checkOrCopyFiles(true) },
        { label: "project.config", icon: "folder", run: () => window.AppWrapperAPI.openConfigFolder() },
        { label: "project.logs", icon: "terminal", run: () => this.fetchAndShowRecentLogs() },
        { label: "project.reset", icon: "image", run: () => this.resetImages() },
        { label: "project.help", icon: "info", run: () => this.openHowToUse() },
      ],
    };
  },
  methods: {
    terminalText,
    openHowToUse() {
      window.open(
        "https://gist.github.com/VitalJeevanjot/fc47aa87b51943f43a85f22f6bd969a1",
        "_blank"
      );
    },
    async openDirectorySelector() {
      if (this.use_website) return;

      const chosen = await window.AppWrapperAPI.openFileFolderSelector(
        undefined, this.$t("dialogs.chooseFolder")
      );
      if (chosen) this.website_input = chosen;
    },
    fetchAndShowRecentLogs() {
      this.liveTerminal = false;
      this.terminalLogs = LocalStorage.getItem("terminal_logs") || "";
      this.terminalProcessDialog = true;
    },
    openTerminal() {
      this.terminalInstance = markRaw(new Terminal());
      this.terminalInstance.open(this.$refs.terminalOutput);
      this.terminalInstance.write(this.terminalLogs);
      if (this.liveTerminal) {
        document.addEventListener("keyup", this.sendKeyToTerminal);
        this.terminalTimer = setInterval(this.pollTerminal, 100);
      }
    },
    stopPollingTerminal() {
      clearInterval(this.terminalTimer);
      document.removeEventListener("keyup", this.sendKeyToTerminal);
      this.liveTerminal = false;
    },
    async closeTerminal() {
      if (this.liveTerminal) await window.AppWrapperAPI.killTerminalProcess();
      this.terminalProcessDialog = false;
    },
    disposeTerminal() {
      this.stopPollingTerminal();
      this.terminalInstance?.dispose();
      this.terminalInstance = null;
    },
    sendKeyToTerminal(event) {
      const escapeCodes = { ArrowUp: "\x1B[A", ArrowDown: "\x1B[B", Enter: "\x0D" };
      if (escapeCodes[event.code]) window.AppWrapperAPI.sendKeyToTerminal(escapeCodes[event.code]);
    },
    writeToTerminal(output) {
      this.terminalLogs += output;
      LocalStorage.set("terminal_logs", this.terminalLogs);
      this.terminalInstance?.write(output);
    },
    async pollTerminal() {
      const { output, exited } = await window.AppWrapperAPI.getOutputForTerminal();
      if (!this.liveTerminal) return;
      if (output) this.writeToTerminal(output);
      if (exited) {
        this.stopPollingTerminal();
        const path = await window.AppWrapperAPI.getPathOfOutput();
        this.writeToTerminal(`\r\n${terminalText("outputPath", { path })}`);
      }
    },
    async createBuildFromURL(fortest, clean) {
      if (!this.website_input.trim()) {
        Notify.create({
          message: this.$t(this.use_website ? "project.websiteRequired" : "project.directoryRequired"),
          type: "negative",
        });
        return;
      }
      if (!this.app_id_input.trim() || !this.app_name_input.trim()) {
        Notify.create({ message: this.$t("project.identityRequired"), type: "negative" });
        return;
      }

      try {
        await window.AppWrapperAPI.setupIcons(JSON.stringify(this.selectedImages));
        await window.AppWrapperAPI.runWrappingScript(
          this.website_input,
          this.app_id_input,
          this.app_name_input,
          this.target_sdk_version_input,
          this.overwrite_settings,
          this.use_website,
          fortest,
          this.first_build ? "clean" : clean,
          { locale: this.$i18n.locale, websiteTitle: this.$t("wrapper.website") }
        );
        LocalStorage.set("after_first_build", true);
        this.first_build = false;
        this.terminalLogs = "";
        this.liveTerminal = true;
        this.terminalProcessDialog = true;
      } catch (error) {
        console.error(error);
        Notify.create({ message: this.$t("project.buildFailed"), type: "negative" });
      }
    },
    async addImage(index) {
      const chosen = await window.AppWrapperAPI.selectAndShowImage(
        this.$t("dialogs.chooseImage"), this.$t("dialogs.images")
      );
      if (chosen) {
        this.selectedImages[index] = { data: chosen[0], path: chosen[1] };
        LocalStorage.set("selectedImages", this.selectedImages);
      }
    },
    resetImages() {
      this.selectedImages = imageSlots();
      LocalStorage.set("selectedImages", this.selectedImages);
    },
    async checkOrCopyFiles(manually) {
      if (!window.AppWrapperAPI || (LocalStorage.getItem("filesCopied") && !manually)) return;

      Loading.show({ message: this.$t("project.copying") });
      try {
        await window.AppWrapperAPI.copyFilesForAllProcesses();
        LocalStorage.set("filesCopied", true);
      } catch (error) {
        console.error(error);
        Notify.create({ message: this.$t("project.copyFailed"), type: "negative" });
      } finally {
        Loading.hide();
      }
    },
  },
  mounted() {
    this.checkOrCopyFiles();
  },
  beforeUnmount() {
    this.disposeTerminal();
  },
});
</script>
