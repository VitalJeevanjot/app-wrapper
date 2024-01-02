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
      <q-img
        v-for="(img, index) in selectedImages"
        :key="img.default_placeholder_text"
        :src="img.img_path"
        style="
          width: 10vw;
          height: 10vw;
          min-width: 100px;
          min-height: 100px;
          margin: 10px;
          cursor: pointer;
        "
        @click="addImage(index)"
      >
        <template v-slot:default v-if="!img.img_path">
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
      }
      // await window.AppWrapperAPI.buildAppFromURL(this.website_input);
    },
    async addImage(_index) {
      let img_data = await window.AppWrapperAPI.selectAndShowImage();
      this.selectedImages[_index].img_path = img_data[0];
      this.selectedImages[_index].default_placeholder_text = img_data[1];
    },
  },
  mounted() {
    this.selectedImages.push({
      img_path: "",
      default_placeholder_text: "Icon Only",
    });
    this.selectedImages.push({
      img_path: "",
      default_placeholder_text: "Icon Foreground",
    });
    this.selectedImages.push({
      img_path: "",
      default_placeholder_text: "Icon Background",
    });
    this.selectedImages.push({
      img_path: "",
      default_placeholder_text: "Splash",
    });
    this.selectedImages.push({
      img_path: "",
      default_placeholder_text: "Splash Dark",
    });
  },
});
</script>
