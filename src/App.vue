<template>
  <div id="app">
    <counter />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, createNamespacedHelpers } from './vuex'
import Counter from './examples/counter/Counter.vue'
const { mapState } = createNamespacedHelpers('account')
export default Vue.extend({
  name: 'App',
  mounted() {
    console.log(this.$store)
    // console.log(this.count)
    console.log(this.name)
    console.log(this.evenOrOdd)
  },
  components: {
    Counter,
  },
  computed: {
    // ...mapState({
    //   count: (state: any) => state.count,
    // }),
    // ...mapState(['count'])
    // ...mapState('account', {
    //   name: (state: any) => state.name,
    // }),
    ...mapState([
      'name'
    ]),
    ...mapGetters([
      'evenOrOdd'
    ]),
  },
})
</script>

<style></style>
