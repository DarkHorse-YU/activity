<script lang="ts" setup>
defineOptions({
  name: 'SubsidyCarParticipate',
})
definePage({
  style: {
    navigationBarTitleText: '补贴参与车企',
  },
})

const carBrands = ref([
  { name: '比亚迪', logo: 'https://via.placeholder.com/100' },
  { name: '特斯拉', logo: 'https://via.placeholder.com/100' },
  { name: '蔚来', logo: 'https://via.placeholder.com/100' },
  { name: '小鹏', logo: 'https://via.placeholder.com/100' },
])
</script>

<template>
  <view class="page-container">
    <view class="header">
      <view class="title">
        参与车企
      </view>
      <view class="subtitle">
        以下车企均可参与补贴活动
      </view>
    </view>

    <view class="brand-list">
      <view v-for="(brand, index) in carBrands" :key="index" class="brand-item">
        <view class="brand-logo">
          <image :src="brand.logo" mode="aspectFit" />
        </view>
        <view class="brand-name">
          {{ brand.name }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff5f5 0%, #ffffff 100%);
}

.header {
  padding: 60rpx 40rpx 40rpx;
  text-align: center;

  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: #ff4d4f;
    margin-bottom: 16rpx;
  }

  .subtitle {
    font-size: 28rpx;
    color: #999999;
  }
}

.brand-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 0 40rpx 40rpx;
}

.brand-item {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

  .brand-logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 16rpx;

    image {
      width: 100%;
      height: 100%;
    }
  }

  .brand-name {
    font-size: 32rpx;
    font-weight: 500;
    color: #333333;
  }
}
</style>
