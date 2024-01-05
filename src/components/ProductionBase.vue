<template>
  <div class="row justify-center q-mt-sm">
    <q-toggle
      label="Production"
      v-model="productionModeToggle"
      color="grey-9"
      keep-color
    />
  </div>

  <div v-if="productionModeToggle"></div>
</template>

<script>
export default {
  name: "ProductionBase",
  data() {
    return {
      productionModeToggle: false,
    };
  },
};
</script>
