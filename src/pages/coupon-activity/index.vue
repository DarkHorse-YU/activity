<script lang="ts" setup>
defineOptions({
  name: 'CouponActivityHome',
})

definePage({
  style: {
    navigationBarTitleText: '抢券活动',
  },
})

function goToRules() {
  uni.navigateTo({ url: '/pages/coupon-activity/rules' })
}

function goToMyCoupons() {
  uni.navigateTo({ url: '/pages/coupon-activity/my-coupons' })
}
</script>

<template>
  <view class="page-container">
    <view class="hero-card">
      <view class="hero-tag">
        Coupon Event
      </view>
      <view class="hero-title">
        抢券活动专区
      </view>
      <view class="hero-desc">
        先领券，再参与活动。请先查看规则，再进入我的券码查看已领取内容。
      </view>
    </view>

    <view class="action-list">
      <view class="action-card primary" @tap="goToRules">
        <view>
          <view class="action-title">
            活动规则
          </view>
          <view class="action-subtitle">
            领取条件、使用说明、有效时间
          </view>
        </view>
        <view class="action-arrow">
          >
        </view>
      </view>

      <view class="action-card secondary" @tap="goToMyCoupons">
        <view>
          <view class="action-title">
            我的券码
          </view>
          <view class="action-subtitle">
            登录后查看已领取券码和使用状态
          </view>
        </view>
        <view class="action-arrow">
          >
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 36rpx 28rpx;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.24), transparent 30%),
    linear-gradient(180deg, #fff9f1 0%, #fff3e0 48%, #fffdf8 100%);
}

.hero-card {
  padding: 40rpx 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #7c2d12 0%, #b45309 48%, #f59e0b 100%);
  box-shadow: 0 18rpx 48rpx rgba(124, 45, 18, 0.24);
}

.hero-tag {
  display: inline-flex;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  color: #fffbeb;
  font-size: 22rpx;
  letter-spacing: 1rpx;
}

.hero-title {
  margin-top: 22rpx;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
}

.hero-desc {
  margin-top: 18rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: rgba(255, 251, 235, 0.9);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 28rpx;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.08);

  &.primary {
    border: 2rpx solid rgba(245, 158, 11, 0.18);
  }

  &.secondary {
    border: 2rpx solid rgba(124, 45, 18, 0.08);
  }
}

.action-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}

.action-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #6b7280;
}

.action-arrow {
  font-size: 34rpx;
  font-weight: 700;
  color: #b45309;
}
</style>
