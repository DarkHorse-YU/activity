<script lang="ts" setup>
defineOptions({
  name: 'SystemHome',
})

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '系统首页',
  },
})

function goToSubsidyActivity() {
  uni.navigateTo({ url: '/pages/activity/index' })
}

function goToCouponActivity() {
  uni.navigateTo({ url: '/pages/coupon-activity/index' })
}
</script>

<template>
  <view class="system-page">
    <view class="hero-card">
      <view class="hero-tag">
        Activity Hub
      </view>
      <view class="hero-title">
        活动中心
      </view>
      <view class="hero-desc">
        统一进入不同活动模块。后续系统展示、运营聚合和活动整合都放在这里。
      </view>
    </view>

    <view class="entry-list">
      <view class="entry-card subsidy" @tap="goToSubsidyActivity">
        <view class="entry-badge">
          补贴活动
        </view>
        <view class="entry-content">
          <view class="entry-title">
            汽车补贴申报
          </view>
          <view class="entry-desc">
            进入补贴活动首页，查看参与企业、申报入口、我的申报和规则。
          </view>
        </view>
        <view class="entry-arrow">
          >
        </view>
      </view>

      <view class="entry-card coupon" @tap="goToCouponActivity">
        <view class="entry-badge">
          抢券活动
        </view>
        <view class="entry-content">
          <view class="entry-title">
            券码领取专区
          </view>
          <view class="entry-desc">
            进入抢券活动首页，查看规则和我的券码。
          </view>
        </view>
        <view class="entry-arrow">
          >
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.system-page {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.16), transparent 28%),
    linear-gradient(180deg, #fffaf3 0%, #fff7ed 38%, #ffffff 100%);
}

.hero-card {
  padding: 38rpx 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #111827 0%, #1f2937 48%, #374151 100%);
  box-shadow: 0 18rpx 48rpx rgba(17, 24, 39, 0.18);
}

.hero-tag {
  display: inline-flex;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  color: #f9fafb;
  font-size: 22rpx;
  letter-spacing: 1rpx;
}

.hero-title {
  margin-top: 22rpx;
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
}

.hero-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: rgba(249, 250, 251, 0.86);
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 28rpx;
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.08);

  &.subsidy {
    border: 2rpx solid rgba(239, 68, 68, 0.12);
  }

  &.coupon {
    border: 2rpx solid rgba(245, 158, 11, 0.14);
  }
}

.entry-badge {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  color: #374151;
  font-size: 22rpx;
  font-weight: 700;
}

.entry-content {
  flex: 1;
}

.entry-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.entry-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #6b7280;
}

.entry-arrow {
  flex-shrink: 0;
  font-size: 34rpx;
  font-weight: 700;
  color: #9ca3af;
}
</style>
