<template>
  <q-btn
    rounded
    flat
    class="text-black q-ma-sm bg-grey-3"
    @click="createKeyToSignDialog = true"
    icon="key"
    style="min-width: 250px; width: 10vw"
    >Create key to sign</q-btn
  >

  <q-dialog v-model="createKeyToSignDialog" persistent>
    <q-card style="max-width: 90vw" class="bg-grey-3">
      <q-card-section class="row items-center q-pb-sm text-black">
        <div class="text-h6">Create key</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pt-sm">
        <div class="row justify-center q-ma-sm">
          <q-input
            outlined
            v-model="key_name"
            label="Enter key name"
            color="black"
            style="width: 60vw; min-width: 250px"
          />
        </div>
        <div class="row justify-center q-ma-sm">
          <q-input
            outlined
            v-model="key_validity"
            type="number"
            label="Enter key validity (days)"
            color="black"
            style="width: 60vw; min-width: 250px"
          />
        </div>
        <div class="row justify-center q-ma-sm">
          <q-input
            outlined
            v-model="key_alias"
            label="Enter key alias"
            color="black"
            style="width: 60vw; min-width: 250px"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn
          rounded
          flat
          class="q-ma-sm bg-grey-10 text-white"
          @click="createKeyToSign"
          style="min-width: 250px; width: 10vw"
          >Create key</q-btn
        >
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
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
      await window.AppWrapperAPI.runKeyCreationScriptForSign(
        this.key_name,
        this.key_validity,
        this.key_alias
      );
    },
  },
};
</script>
