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
        color="grey-9"
        style="width: 60vw; min-width: 250px"
      />
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
            <div class="absolute-full bg-grey text-white">
              <div class="row justify-center">➕</div>
              <div class="row justify-center">
                {{ img.default_placeholder_text }}
              </div>
            </div>
          </template>
          <q-tooltip class="text-subtitle2" v-if="img.img_path">{{
            img.default_placeholder_text
          }}</q-tooltip>
        </q-img>

        <q-btn
          class="text-white btn bg-grey-5"
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
    <div class="row justify-center q-mt-sm">
      <span class="text-subtitle2"
        >Click on them to upload. Icon files should be at least 1024px x 1024px
        & Splash screen files should be at least 2732px x 2732px.</span
      >
    </div>
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
import { defineComponent } from "vue";
import { Notify } from "quasar";

export default defineComponent({
  name: "IndexPage",
  data() {
    return {
      website_input: "",
      selectedImages: [],
    };
  },
  methods: {
    async createBuildFromURL() {
      if (!this.website_input) {
        Notify.create({ message: "⚠️ Website URL required", color: "black" });
        return;
      }
      await window.AppWrapperAPI.setupIcons(
        JSON.stringify(this.selectedImages)
      );
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
