<template>
  <q-page class="q-pa-md">
    <!-- <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    > -->
    <div class="row justify-center q-mt-sm">
      <q-toggle
        label="Website URL or Directory Path"
        v-model="use_website"
        color="grey-9"
        keep-color
      />
    </div>
    <div class="row justify-center">
      <q-input
        outlined
        v-model="website_input"
        :label="`${
          use_website ? 'Enter website URL' : 'Click to select directory path'
        }`"
        :readonly="use_website ? false : true"
        @click="openDirectorySelector"
        color="black"
        style="width: 60vw; min-width: 250px"
      />
    </div>
    <div class="row justify-center q-mt-sm">
      <q-input
        outlined
        v-model="app_id_input"
        label="Enter app ID (e.g: com.website.app)"
        color="black"
        style="width: 60vw; min-width: 250px"
      />
    </div>
    <div class="row justify-center q-mt-sm">
      <q-input
        outlined
        v-model="app_name_input"
        label="Enter app Name"
        color="black"
        style="width: 60vw; min-width: 250px"
      />
    </div>
    <div class="row justify-center q-mt-sm">
      <q-input
        outlined
        type="number"
        v-model="target_sdk_version_input"
        label="Target sdk version (e.g. 33)"
        color="black"
        style="width: 60vw; min-width: 250px"
      />
    </div>
    <div class="row justify-center q-mt-sm">
      <q-toggle
        label="Overwrite variables file with above target sdk"
        v-model="overwrite_settings"
        color="grey-9"
        keep-color
      />
    </div>
    <div class="row justify-center q-mt-md">
      <span class="text-subtitle2"
        >Click on it to upload. Icon files should be at least 1024px x 1024px &
        Splash screen files should be at least 2732px x 2732px.</span
      >
    </div>
    <div class="row justify-center q-mt-sm">
      <div
        class="container"
        v-for="(img, index) in selectedImages"
        :key="img.path"
      >
        <q-img
          :src="img.data"
          class="self-start"
          style="
            width: 10vw;
            height: 10vw;
            min-width: 100px;
            min-height: 100px;
            cursor: pointer;
          "
          @click="addImage(index)"
        >
          <template v-slot:default v-if="!img.data">
            <div class="absolute-full bg-grey-9 text-white">
              <div class="row justify-center">
                <q-icon name="add" size="md" />
              </div>
              <div class="row justify-center">
                {{ img.default_placeholder_text }}
              </div>
            </div>
          </template>
          <q-tooltip class="text-subtitle2" v-if="img.path">{{
            img.default_placeholder_text
          }}</q-tooltip>
        </q-img>

        <q-btn
          class="text-white btn bg-grey-9"
          dense
          size="0.8rem"
          flat
          icon="info"
          rounded
        >
          <q-popup-proxy>
            <q-banner>
              {{ img.path ? img.path : "Not selected...." }}
            </q-banner>
          </q-popup-proxy></q-btn
        >
        <p
          style="width: 10vw; min-width: 100px; overflow-wrap: break-word"
          class="text-black q-pt-xs"
        >
          {{
            img.path ? img.path.split("\\").pop() : img.default_placeholder_text
          }}
        </p>
      </div>
    </div>

    <q-dialog v-model="terminalProcessDialog" persistent>
      <q-card style="max-width: 90vw" class="bg-black">
        <q-card-section class="row items-center q-pb-sm text-white">
          <div class="text-h6">Terminal</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeTerminal" />
        </q-card-section>
        <q-separator dark />
        <q-card-section class="q-pt-sm">
          <div id="terminal"></div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <div class="row justify-center q-mt-sm">
      <q-btn
        rounded
        flat
        class="bg-purple q-mx-sm text-white"
        v-if="!first_build"
        @click="createBuildFromURL"
        >Build</q-btn
      >
      <q-btn
        rounded
        flat
        class="bg-purple-9 q-mx-sm text-white"
        @click="createBuildFromURL(null, 'clean')"
        >Clean Build</q-btn
      >
      <q-btn
        rounded
        flat
        class="bg-grey-3 q-mx-sm text-black"
        @click="createBuildFromURL('fortest')"
        >Test</q-btn
      >
    </div>
    <ProductionBase />
    <div class="row justify-center q-mt-md">
      <q-btn
        rounded
        flat
        class="text-black q-ma-sm bg-grey-3"
        @click="checkOrCopyFiles(true)"
        icon="content_copy"
        style="min-width: 250px; width: 10vw"
        >Install Dependencies</q-btn
      >
      <q-btn
        rounded
        flat
        class="text-black q-ma-sm bg-grey-3"
        @click="openConfigFolder"
        icon="folder"
        style="min-width: 250px; width: 10vw"
        >Config folder</q-btn
      >
      <q-btn
        rounded
        flat
        class="text-black q-ma-sm bg-grey-3"
        @click="fetchAndShowRecentLogs"
        icon="terminal"
        style="min-width: 250px; width: 10vw"
        >Recent logs</q-btn
      >
      <q-btn
        rounded
        flat
        class="text-black q-ma-sm bg-grey-3"
        @click="getDefaultImageDataAtIndex(null, true)"
        icon="image"
        style="min-width: 250px; width: 10vw"
        >Reset images</q-btn
      >
      <q-btn
        rounded
        flat
        class="text-black q-ma-sm bg-grey-3"
        @click="openHowToUse"
        icon="info"
        style="min-width: 250px; width: 10vw"
        >How to use</q-btn
      >
      <CreateKeyToSign />
    </div>
  </q-page>
</template>

<style>
.xterm .xterm-screen {
  margin-right: 20px;
}
</style>

<style scoped>
.container {
  position: relative;
  margin: 10px;
}
.container .btn {
  position: absolute;
  transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
}

#terminal {
  /* Align the viewport to the bottom of the panel, just like the terminal */
  background-color: black;
  /* overflow: hidden;
  overflow-y: auto; */
}
</style>

<script>
import { defineComponent, ref } from "vue";
import { Loading, LocalStorage, Notify } from "quasar";
import { Terminal } from "xterm";
import ProductionBase from "components/ProductionBase.vue";
import CreateKeyToSign from "components/CreateKeyToSign.vue";

export default defineComponent({
  name: "IndexPage",
  components: {
    ProductionBase,
    CreateKeyToSign,
  },
  data() {
    return {
      use_website: true,
      website_input: "",
      app_id_input: "",
      app_name_input: "",
      target_sdk_version_input: 33,
      selectedImages: [],
      terminalProcessDialog: false,
      terminalInstance: null,
      terminalLogs: null,
      overwrite_settings: true,
      event_listener_added: false,
      first_build: false,
    };
  },
  methods: {
    openHowToUse() {
      window.open(
        "https://gist.github.com/VitalJeevanjot/fc47aa87b51943f43a85f22f6bd969a1",
        "_blank"
      );
    },
    async openDirectorySelector() {
      if (this.use_website == false) {
        this.website_input =
          await window.AppWrapperAPI.openFileFolderSelector();
      }
    },
    async fetchAndShowRecentLogs() {
      let logs = LocalStorage.getItem("terminal_logs");
      this.terminalProcessDialog = true;
      // setTimeout()
      // console.log(logs);
      setTimeout(() => {
        this.terminalInstance = new Terminal();
        this.terminalInstance.open(document.getElementById("terminal"));
        this.terminalInstance.write(logs);
      }, 200);
    },
    async closeTerminal() {
      await window.AppWrapperAPI.killTerminalProcess(); // it will only kill if the process exist...
      this.terminalProcessDialog = false;
    },
    sendKeyToTerminal(e) {
      if (e.code == "ArrowUp") {
        window.AppWrapperAPI.sendKeyToTerminal("\x1B[A");
      } else if (e.code == "ArrowDown") {
        window.AppWrapperAPI.sendKeyToTerminal("\x1B[B");
      } else if (e.code == "Enter") {
        window.AppWrapperAPI.sendKeyToTerminal("\x0D");
      }
    },
    openAndroidManifest() {
      window.AppWrapperAPI.openAndroidManifest();
    },
    openConfigFolder() {
      window.AppWrapperAPI.openConfigFolder();
    },
    writeToTerminal(output) {
      this.terminalLogs = this.terminalLogs + output;
      LocalStorage.set("terminal_logs", this.terminalLogs);
      this.terminalInstance.write(output);
      console.log(output);
    },
    async showTerminalLogs() {
      this.terminalLogs = "";
      this.terminalProcessDialog = true;
      setTimeout(async () => {
        this.terminalInstance = new Terminal();
        this.terminalInstance.open(document.getElementById("terminal"));
        var terminal_output = setInterval(async () => {
          var getStdout = await window.AppWrapperAPI.getOutputForTerminal();
          if (getStdout?.trim()) {
            this.writeToTerminal(getStdout);
          } else {
            this.writeToTerminal(".");
          }
          if (getStdout && getStdout?.includes("process exited with code")) {
            clearInterval(terminal_output);
            if (this.event_listener_added == true) {
              document.removeEventListener("keyup", this.sendKeyToTerminal);
              this.event_listener_added = false;
            }
            this.writeToTerminal(
              "\r\nOutput path: " +
                (await window.AppWrapperAPI.getPathOfOutput())
            );
          }
          // getStdout = getStdout?.replace("\n", "");

          // console.log(_commands_to_run);
          // for (let i = 0; i < _commands_to_run.length; i++) {
          //   // console.log(_commands_to_run[i].trim().length);
          //   if (_commands_to_run[i].trim().length > 1) {
          //     await window.AppWrapperAPI.runScriptFile(_commands_to_run[i]);
          //   }
          // }
        }, 100);
      }, 200);
    },
    async createBuildFromURL(fortest, clean) {
      if (!LocalStorage.getItem("after_first_build")) {
        LocalStorage.set("after_first_build", true);
        clean = "clean";
      }
      if (!this.website_input.trim()) {
        Notify.create({
          message: "⚠️ Website URL required",
          color: "black",
          position: "bottom-right",
        });
        return;
      }
      if (!this.app_id_input.trim() || !this.app_name_input.trim()) {
        Notify.create({
          message: "⚠️ App ID and Name required",
          color: "black",
          position: "bottom-right",
        });
        return;
      }

      await window.AppWrapperAPI.setupIcons(
        JSON.stringify(this.selectedImages)
      );
      document.addEventListener("keyup", this.sendKeyToTerminal);
      this.event_listener_added = true;
      this.showTerminalLogs();
      await window.AppWrapperAPI.runWrappingScript(
        this.website_input,
        this.app_id_input,
        this.app_name_input,
        this.target_sdk_version_input,
        this.overwrite_settings,
        this.use_website,
        fortest,
        clean
      );

      // await window.AppWrapperAPI.buildAppFromURL(this.website_input);
    },
    async addImage(_index) {
      let img_data = await window.AppWrapperAPI.selectAndShowImage();
      if (img_data) {
        this.selectedImages[_index].data = img_data[0];
        this.selectedImages[_index].path = img_data[1];
      }
      LocalStorage.set("selectedImages", this.selectedImages);
    },
    getDefaultImageDataAtIndex(index, atFull) {
      var imgData = [
        {
          data: "",
          default_placeholder_text: "Icon Only",
          path: "",
        },
        {
          data: "",
          default_placeholder_text: "Icon Foreground",
          path: "",
        },
        {
          data: "",
          default_placeholder_text: "Icon Background",
          path: "",
        },
        {
          data: "",
          default_placeholder_text: "Splash",
          path: "",
        },
        {
          data: "",
          default_placeholder_text: "Splash Dark",
          path: "",
        },
      ];
      if (atFull) {
        this.selectedImages = imgData;
        LocalStorage.set("selectedImages", this.selectedImages);
      }
      return imgData[index];
    },
    async checkOrCopyFiles(manually) {
      if (LocalStorage.getItem("filesCopied") && !manually) {
        return;
      } else {
        Loading.show({ message: "Copying files...." });
        await window.AppWrapperAPI.copyFilesForAllProcesses();
        LocalStorage.set("filesCopied", true);
        Loading.hide();
      }
    },
  },
  async mounted() {
    if (!LocalStorage.getItem("after_first_build")) {
      this.first_build = true;
    }
    await this.checkOrCopyFiles();
    this.selectedImages = LocalStorage.getItem("selectedImages");
    if (!this.selectedImages) {
      this.selectedImages = [];
    }
    for (let i = 0; i < 5; i++) {
      if (this.selectedImages[i]) {
        // console.log("step 1");
        if (!this.selectedImages[i].data || !this.selectedImages[i].path) {
          // console.log("step 2");
          this.selectedImages[i] = this.getDefaultImageDataAtIndex(i);
        }
      } else {
        this.selectedImages.push(this.getDefaultImageDataAtIndex(i));
      }
    }
  },
});
</script>
