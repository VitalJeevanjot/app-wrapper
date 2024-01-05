<template>
  <q-page class="q-pa-md">
    <!-- <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    > -->
    <div class="row justify-center">
      <q-input
        outlined
        v-model="website_input"
        label="Enter website"
        color="black"
        style="width: 60vw; min-width: 250px"
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

    <ProductionBase />

    <q-dialog v-model="terminalProcessDialog" persistent>
      <q-card style="max-width: 90vw" class="bg-black">
        <q-card-section class="row items-center q-pb-sm text-white">
          <div class="text-h6">Terminal</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-separator dark />
        <q-card-section class="q-pt-sm">
          <div
            id="terminal"
            style="background-color: black; overflow: hidden; overflow-y: auto"
          ></div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <div class="row justify-center q-mt-sm">
      <q-btn
        rounded
        flat
        class="bg-grey-3 text-black"
        @click="createBuildFromURL"
        >Build</q-btn
      >
    </div>
  </q-page>
</template>

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
</style>

<script>
import { defineComponent, ref } from "vue";
import { Notify } from "quasar";
import { Terminal } from "xterm";
import ProductionBase from "components/ProductionBase.vue";

export default defineComponent({
  name: "IndexPage",
  components: {
    ProductionBase,
  },
  data() {
    return {
      website_input: "",
      selectedImages: [],
      terminalProcessDialog: false,
      terminalInstance: null,
    };
  },
  methods: {
    async createBuildFromURL() {
      let channel = "terminal_output";

      // window.electron_ipcRenderer.removeAllListeners(channel);
      // window.electron_ipcRenderer.on(channel, (event, message) => {
      //   if (terminalInstance) {
      //     terminalInstance.write(message);
      //   }
      // });
      if (!this.website_input) {
        Notify.create({ message: "⚠️ Website URL required", color: "black" });
        return;
      }
      this.terminalProcessDialog = true;
      setTimeout(async () => {
        this.terminalInstance = new Terminal();
        this.terminalInstance.open(document.getElementById("terminal"));
        this.terminalInstance.write("$");

        let _commands_to_run = await window.AppWrapperAPI.getBuildCommands();
        console.log(_commands_to_run);
        for (let i = 0; i < _commands_to_run.length; i++) {
          await window.AppWrapperAPI.runBatchFile(_commands_to_run[i]);
        }
      }, 500);
      // await window.AppWrapperAPI.setupIcons(
      //   JSON.stringify(this.selectedImages)
      // );
      // await window.AppWrapperAPI.buildAppFromURL(this.website_input);
    },
    async addImage(_index) {
      let img_data = await window.AppWrapperAPI.selectAndShowImage();
      if (img_data) {
        this.selectedImages[_index].data = img_data[0];
        this.selectedImages[_index].path = img_data[1];
      }
    },
  },
  mounted() {
    this.selectedImages.push({
      data: "",
      default_placeholder_text: "Icon Only",
      path: "",
    });
    this.selectedImages.push({
      data: "",
      default_placeholder_text: "Icon Foreground",
      path: "",
    });
    this.selectedImages.push({
      data: "",
      default_placeholder_text: "Icon Background",
      path: "",
    });
    this.selectedImages.push({
      data: "",
      default_placeholder_text: "Splash",
      path: "",
    });
    this.selectedImages.push({
      data: "",
      default_placeholder_text: "Splash Dark",
      path: "",
    });
  },
});
</script>
