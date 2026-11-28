<template>
  <div class="error-page bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div class="error-code">404</div>
      <h1 class="error-message q-mt-md q-mb-none">{{ $t("errors.notFound") }}</h1>
      <q-btn
        class="q-mt-xl app-action"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        :label="$t('errors.goHome')"
        no-caps
      />
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
}

.error-code {
  font-size: clamp(4rem, 24vmin, 11rem);
  line-height: 1;
}

.error-message {
  font-size: clamp(1.5rem, 5vw, 3.75rem);
  line-height: 1.2;
  overflow-wrap: anywhere;
}
</style>

<script>
export default {
  name: "ErrorNotFound",
};
</script>
