<template>
  <div id="counter">
    Clicked: {{ $store.state.count }} times, count is {{ evenOrOdd }}.
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="incrementIfOdd">Increment if odd</button>
    <button @click="incrementAsync">Increment async</button>
    <button @click="add">+1</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapActions, mapMutations } from '@/vuex'
export default Vue.extend({
  name: 'Counter',
  computed: {
    ...mapGetters(['evenOrOdd']),
  },
  methods: {
    ...mapActions([
      'increment',
      'decrement',
      'incrementIfOdd',
      'incrementAsync',
    ]),
    ...mapMutations({
      add: 'increment'
    })
  },
})
</script>

<style></style>
