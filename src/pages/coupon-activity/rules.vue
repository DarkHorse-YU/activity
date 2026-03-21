<script lang="ts" setup>
defineOptions({
  name: 'CouponActivityRules',
})

definePage({
  style: {
    navigationBarTitleText: '抢券活动规则',
  },
})

const imageUrl = 'http://124.221.55.156:9000/xiaoyu/coupon/rule.png'
</script>

<template>
  <view class="page-container">
    <image
      class="page-image"
      :src="imageUrl"
      mode="widthFix"
    />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #fdf6fb;
}

.page-image {
  display: block;
  width: 100%;
}
</style>
