<script lang="ts" setup>
defineOptions({
  name: 'ActivityRules',
})
definePage({
  style: {
    navigationBarTitleText: '活动规则',
  },
})
</script>

<template>
  <view class="page-container">
    <image
      class="rules-image"
      src="http://124.221.55.156:9000/xiaoyu/activity/design1.png"
      mode="widthFix"
    />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: rgb(255, 147, 91);
}

.rules-image {
  width: 100%;
  display: block;
  vertical-align: bottom;
}
</style>
