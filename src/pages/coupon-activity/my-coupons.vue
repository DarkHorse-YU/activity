<script lang="ts" setup>
defineOptions({
  name: 'MyCoupons',
})

definePage({
  style: {
    navigationBarTitleText: '我的券码',
  },
})

type CouponStatus = 'unused' | 'used' | 'expired'

interface CouponItem {
  id: number
  title: string
  code: string
  expiresAt: string
  status: CouponStatus
}

const coupons = ref<CouponItem[]>([
  {
    id: 1,
    title: '购车活动通用券',
    code: 'QJ26-8X9P-12AB',
    expiresAt: '2026-04-30 23:59',
    status: 'unused',
  },
  {
    id: 2,
    title: '周末专享礼券',
    code: 'WK26-6C7D-98EF',
    expiresAt: '2026-03-20 23:59',
    status: 'used',
  },
])

function getStatusMeta(status: CouponStatus) {
  switch (status) {
    case 'used':
      return { text: '已使用', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' }
    case 'expired':
      return { text: '已过期', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' }
    default:
      return { text: '待使用', color: '#b45309', bg: 'rgba(245, 158, 11, 0.14)' }
  }
}
</script>

<template>
  <view class="page-container">
    <view class="page-header">
      <view class="page-title">
        我的券码
      </view>
      <view class="page-subtitle">
        这里展示当前账号已领取的券码，可用于后续核销或活动兑换。
      </view>
    </view>

    <view v-if="coupons.length > 0" class="coupon-list">
      <view v-for="coupon in coupons" :key="coupon.id" class="coupon-card">
        <view class="coupon-top">
          <view class="coupon-name">
            {{ coupon.title }}
          </view>
          <view
            class="coupon-status"
            :style="{ color: getStatusMeta(coupon.status).color, background: getStatusMeta(coupon.status).bg }"
          >
            {{ getStatusMeta(coupon.status).text }}
          </view>
        </view>

        <view class="coupon-code">
          {{ coupon.code }}
        </view>

        <view class="coupon-footer">
          有效期至：{{ coupon.expiresAt }}
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <view class="empty-title">
        暂无券码
      </view>
      <view class="empty-desc">
        你还没有领取任何券码，请先前往抢券活动首页参与。
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 28%),
    linear-gradient(180deg, #fffef8 0%, #fff7ed 38%, #ffffff 100%);
}

.page-header {
  margin-bottom: 24rpx;
}

.page-title {
  font-size: 42rpx;
  font-weight: 700;
  color: #1f2937;
}

.page-subtitle {
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #6b7280;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.coupon-card {
  padding: 28rpx 26rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.07);
  border: 2rpx solid rgba(245, 158, 11, 0.08);
}

.coupon-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.coupon-name {
  font-size: 31rpx;
  font-weight: 700;
  color: #111827;
}

.coupon-status {
  flex-shrink: 0;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.coupon-code {
  margin-top: 24rpx;
  padding: 20rpx 24rpx;
  border-radius: 18rpx;
  background: #fff7ed;
  font-size: 34rpx;
  font-weight: 700;
  color: #b45309;
  letter-spacing: 2rpx;
}

.coupon-footer {
  margin-top: 18rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.empty-state {
  margin-top: 120rpx;
  padding: 40rpx 32rpx;
  text-align: center;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
}

.empty-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.empty-desc {
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #6b7280;
}
</style>
