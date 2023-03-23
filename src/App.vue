<template>
  <div id="app">
    <button @click="btnClick">+1</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'App',
  methods: {
    btnClick() {
      this.$store.commit('TEST', 1)
      console.log(this.$store)
    }
  }
})
</script>

<style></style>
