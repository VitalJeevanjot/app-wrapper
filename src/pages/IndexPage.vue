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
      <q-btn rounded flat class="bg-grey-3 text-black" @click="createBuild"
        >Build</q-btn
      >
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "IndexPage",
  data() {
    return {
      website_input: "",
    };
  },
  methods: {
    createBuild() {
      console.log("hello");
    },
  },
});
</script>
