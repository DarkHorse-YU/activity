<script lang="ts" setup>
import type { CouponCodeItem } from '@/api/coupon-activity'
import { getMyCouponCodes } from '@/api/coupon-activity'
import QrCodePopup from './QrCodePopup.vue'

defineOptions({
  name: 'MyCoupons',
})

definePage({
  style: {
    navigationBarTitleText: '我的券码',
  },
})

const loading = ref(true)
const coupons = ref<CouponCodeItem[]>([])

// 二维码弹窗状态
const showQrPopup = ref(false)
const currentQrCoupon = ref<CouponCodeItem | null>(null)

async function fetchCoupons() {
  loading.value = true
  try {
    coupons.value = await getMyCouponCodes(1)
  }
  catch (error) {
    console.error('获取我的券码失败', error)
    uni.showToast({
      title: '获取券码失败',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}

// 状态配置：颜色、背景、边框、图标
function getStatusMeta(status?: string) {
  const normalized = (status || '').toUpperCase()

  if (normalized === 'APPROVED') {
    return {
      text: '已核销',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.18)',
      icon: '✓',
    }
  }

  if (normalized === 'EXPIRED') {
    return {
      text: '已过期',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.18)',
      icon: '⏱',
    }
  }

  if (normalized === 'CANCELLED') {
    return {
      text: '已作废',
      color: '#8a7182',
      bg: 'rgba(138, 113, 130, 0.14)',
      border: 'rgba(138, 113, 130, 0.18)',
      icon: '✕',
    }
  }

  // UNUSED - 待使用
  return {
    text: '待使用',
    color: '#f26da8',
    bg: 'rgba(242, 109, 168, 0.12)',
    border: 'rgba(242, 109, 168, 0.18)',
    icon: '★',
  }
}

// 格式化优惠券金额显示
function formatCouponValue(coupon: CouponCodeItem) {
  if (coupon.couponType === 'DISCOUNT') {
    const discount = (coupon.discountRate || 1) * 10
    return discount >= 10 ? `${discount / 10}折` : `${discount}折`
  }
  return `¥${coupon.discountAmount}`
}

// 格式化门槛
function formatThreshold(coupon: CouponCodeItem) {
  if (coupon.couponType === 'DISCOUNT') {
    return '全场通用'
  }
  if (coupon.thresholdAmount && coupon.thresholdAmount > 0) {
    return `满${coupon.thresholdAmount}可用`
  }
  return '无门槛'
}

// 格式化有效期
function formatValidPeriod(coupon: CouponCodeItem) {
  if (!coupon.validEndTime)
    return '长期有效'
  const end = coupon.validEndTime.split(' ')[0]
  return `有效期至 ${end}`
}

// 复制券码
function copyCouponCode(code?: string) {
  if (!code) {
    uni.showToast({
      title: '券码为空',
      icon: 'none',
    })
    return
  }

  uni.setClipboardData({
    data: code,
    success: () => {
      uni.showToast({
        title: '券码已复制',
        icon: 'none',
      })
    },
  })
}

// 显示二维码弹窗
function showQrCode(coupon: CouponCodeItem) {
  currentQrCoupon.value = coupon
  showQrPopup.value = true
}

// 关闭二维码弹窗
function closeQrPopup() {
  showQrPopup.value = false
  currentQrCoupon.value = null
}

// 统计数量
const availableCount = computed(() => {
  return coupons.value.filter(item =>
    item.status === 'UNUSED',
  ).length
})

const usedCount = computed(() => {
  return coupons.value.filter(item =>
    item.status === 'APPROVED' || item.status === 'CANCELLED',
  ).length
})

onMounted(() => {
  fetchCoupons()
})
</script>

<template>
  <view class="page-container">
    <!-- Hero 卡片区域 -->
    <view class="hero-card">
      <view class="hero-decoration-1" />
      <view class="hero-decoration-2" />

      <view class="hero-header">
        <view class="hero-badge">
          <text class="hero-badge-icon">券</text>
          <text class="hero-badge-text">MY COUPONS</text>
        </view>
        <view class="hero-title">
          我的券码
        </view>
        <view class="hero-desc">
          已领取的活动券码会展示在这里，可复制后用于后续核销或兑换
        </view>
      </view>

      <view class="hero-stats">
        <view class="hero-stat">
          <text class="hero-stat-value">
            {{ coupons.length }}
          </text>
          <text class="hero-stat-label">
            全部券码
          </text>
        </view>
        <view class="hero-stat hero-stat-accent">
          <text class="hero-stat-value">
            {{ availableCount }}
          </text>
          <text class="hero-stat-label">
            待使用
          </text>
        </view>
        <view class="hero-stat">
          <text class="hero-stat-value">
            {{ usedCount }}
          </text>
          <text class="hero-stat-label">
            已使用
          </text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="state-card">
      <view class="loading-spinner" />
      <text class="state-title">
        券码加载中
      </text>
      <text class="state-desc">
        正在同步你已领取的活动券码...
      </text>
    </view>

    <!-- 券码列表 -->
    <view v-else-if="coupons.length > 0" class="coupon-list">
      <view
        v-for="coupon in coupons"
        :key="coupon.id || coupon.couponNo"
        class="coupon-card"
        :class="{ 'coupon-card-disabled': coupon.status !== 'UNUSED' }"
      >
        <!-- 左侧金额区域 -->
        <view class="coupon-left">
          <view class="coupon-value">
            {{ formatCouponValue(coupon) }}
          </view>
          <view class="coupon-threshold">
            {{ formatThreshold(coupon) }}
          </view>
        </view>

        <!-- 装饰圆点 -->
        <view class="coupon-dot coupon-dot-top" />
        <view class="coupon-dot coupon-dot-bottom" />

        <!-- 右侧信息区域 -->
        <view class="coupon-right">
          <!-- 顶部：标题和状态 -->
          <view class="coupon-header">
            <view class="coupon-title-wrap">
              <text class="coupon-title">
                {{ coupon.templateName || '活动券码' }}
              </text>
              <text class="coupon-activity">
                {{ coupon.activityName }}
              </text>
            </view>
            <view
              class="coupon-status"
              :style="{
                color: getStatusMeta(coupon.status).color,
                background: getStatusMeta(coupon.status).bg,
                borderColor: getStatusMeta(coupon.status).border,
              }"
            >
              {{ getStatusMeta(coupon.status).text }}
            </view>
          </view>

          <!-- 有效期 -->
          <view class="coupon-validity">
            <text class="validity-icon">⏱</text>
            <text class="validity-text">{{ formatValidPeriod(coupon) }}</text>
          </view>

          <!-- 券码区域 -->
          <view class="coupon-code-box">
            <text class="coupon-code">
              {{ coupon.couponNo || '-' }}
            </text>
            <!-- 待使用状态显示操作按钮 -->
            <view v-if="coupon.status === 'UNUSED'" class="coupon-actions">
              <view class="coupon-qr-btn" @tap="showQrCode(coupon)">
                <text class="btn-icon"> QR </text>
              </view>
              <view class="coupon-copy-btn" @tap="copyCouponCode(coupon.couponNo)">
                复制
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="state-card state-card-empty">
      <view class="empty-icon">
        🎫
      </view>
      <text class="state-title">
        暂无券码
      </text>
      <text class="state-desc">
        你还没有领取任何券码
      </text>
      <view class="empty-action" @tap="() => uni.navigateTo({ url: '/pages/coupon-activity/index' })">
        去抢券
      </view>
    </view>

    <!-- 二维码弹窗 -->
    <QrCodePopup
      v-model:visible="showQrPopup"
      :qr-token="currentQrCoupon?.qrToken"
      :coupon-no="currentQrCoupon?.couponNo"
      :coupon-name="currentQrCoupon?.templateName"
      :coupon-value="currentQrCoupon ? formatCouponValue(currentQrCoupon) : ''"
      @close="closeQrPopup"
    />
  </view>
</template>

<style lang="scss" scoped>
// 页面容器 - 粉色渐变背景
.page-container {
  min-height: 100vh;
  padding: 28rpx 24rpx 48rpx;
  background:
    radial-gradient(circle at top left, rgba(255, 208, 227, 0.92), transparent 28%),
    radial-gradient(circle at bottom right, rgba(242, 109, 168, 0.15), transparent 35%),
    linear-gradient(180deg, #fff7fa 0%, #fff1f6 44%, #fffafc 100%);
}

// Hero 卡片 - 3D 质感风格
.hero-card {
  position: relative;
  overflow: hidden;
  padding: 36rpx 28rpx;
  border-radius: 36rpx;
  background: linear-gradient(145deg, #fff8fb 0%, #ffe6f0 100%);
  border: 3rpx solid #ffd8e8;
  box-shadow:
    0 8rpx 0 #f5c4d8,
    0 12rpx 32rpx rgba(242, 109, 168, 0.2),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.85);
}

.hero-decoration-1 {
  position: absolute;
  top: -30rpx;
  right: -20rpx;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.hero-decoration-2 {
  position: absolute;
  bottom: -50rpx;
  left: 20rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(242, 109, 168, 0.1);
}

.hero-header {
  position: relative;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: linear-gradient(145deg, rgba(242, 109, 168, 0.15), rgba(242, 109, 168, 0.08));
  border: 2rpx solid rgba(242, 109, 168, 0.2);
}

.hero-badge-icon {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f26da8, #e85a95);
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
}

.hero-badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #ea6ca6;
  letter-spacing: 2rpx;
}

.hero-title {
  margin-top: 20rpx;
  font-size: 48rpx;
  font-weight: 800;
  color: #5b2941;
  letter-spacing: 2rpx;
}

.hero-desc {
  margin-top: 12rpx;
  max-width: 700rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #9c7085;
}

// 统计数据
.hero-stats {
  position: relative;
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.hero-stat {
  flex: 1;
  min-width: 0;
  padding: 20rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(242, 109, 168, 0.12);
  box-shadow:
    inset 0 2rpx 0 rgba(255, 255, 255, 0.9),
    0 4rpx 12rpx rgba(242, 109, 168, 0.08);
  text-align: center;
}

.hero-stat-accent {
  background: linear-gradient(145deg, rgba(242, 109, 168, 0.12), rgba(242, 109, 168, 0.06));
  border-color: rgba(242, 109, 168, 0.2);
}

.hero-stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #71415a;
}

.hero-stat-accent .hero-stat-value {
  color: #f26da8;
}

.hero-stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9c7085;
}

// 券码列表
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 28rpx;
}

// 券码卡片 - 优惠券风格
.coupon-card {
  position: relative;
  display: flex;
  overflow: visible;
  border-radius: 28rpx;
  background: #fff;
  border: 3rpx solid #ffdce9;
  box-shadow:
    0 8rpx 0 #f8d4e0,
    0 12rpx 28rpx rgba(242, 109, 168, 0.15),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.9);
  transition: transform 0.2s ease;
}

.coupon-card-disabled {
  opacity: 0.75;
}

// 左侧金额区域
.coupon-left {
  width: 180rpx;
  padding: 32rpx 16rpx;
  background: linear-gradient(145deg, #f26da8 0%, #e85a95 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  border-radius: 24rpx 0 0 24rpx;
}

.coupon-value {
  font-size: 52rpx;
  font-weight: 800;
  line-height: 1;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(180, 50, 90, 0.3);
}

.coupon-threshold {
  margin-top: 12rpx;
  font-size: 20rpx;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(4rpx);
}

// 装饰圆点
.coupon-dot {
  position: absolute;
  left: 168rpx;
  width: 24rpx;
  height: 24rpx;
  background: #fff5f8;
  border-radius: 50%;
  z-index: 2;
}

.coupon-dot-top {
  top: -12rpx;
  box-shadow: inset 0 -4rpx 8rpx rgba(242, 109, 168, 0.15);
}

.coupon-dot-bottom {
  bottom: -12rpx;
  box-shadow: inset 0 4rpx 8rpx rgba(242, 109, 168, 0.15);
}

// 右侧信息区域
.coupon-right {
  flex: 1;
  padding: 24rpx 24rpx 24rpx 20rpx;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: linear-gradient(180deg, #fff 0%, #fff8fa 100%);
  border-radius: 0 24rpx 24rpx 0;
}

.coupon-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.coupon-title-wrap {
  flex: 1;
  min-width: 0;
}

.coupon-title {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #5b2941;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-activity {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9f7589;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-status {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  border-width: 2rpx;
  border-style: solid;
  font-size: 20rpx;
  font-weight: 700;
}

// 有效期
.coupon-validity {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
}

.validity-icon {
  font-size: 20rpx;
}

.validity-text {
  font-size: 22rpx;
  color: #9c7085;
}

// 券码区域
.coupon-code-box {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 20rpx;
  background: linear-gradient(90deg, #fff0f6 0%, #fff8fb 100%);
  border: 2rpx dashed #ffc5de;
}

.coupon-code {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 800;
  color: #ea5f98;
  letter-spacing: 1rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 操作按钮区域
.coupon-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

// 二维码按钮
.coupon-qr-btn {
  width: 60rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: linear-gradient(145deg, #86d7ff 0%, #5db9ff 100%);
  box-shadow:
    0 4rpx 0 #3a9fd9,
    0 6rpx 12rpx rgba(93, 185, 255, 0.3);
  transition: transform 0.15s ease;

  &:active {
    transform: translateY(2rpx);
    box-shadow:
      0 2rpx 0 #3a9fd9,
      0 4rpx 8rpx rgba(93, 185, 255, 0.2);
  }
}

.btn-icon {
  font-size: 18rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1rpx;
}

// 复制按钮
.coupon-copy-btn {
  flex-shrink: 0;
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(145deg, #f58bbe 0%, #ea5f98 100%);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow:
    0 4rpx 0 #d54d82,
    0 6rpx 16rpx rgba(234, 95, 152, 0.3);
  min-height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;

  &:active {
    transform: translateY(2rpx);
    box-shadow:
      0 2rpx 0 #d54d82,
      0 4rpx 8rpx rgba(234, 95, 152, 0.2);
  }
}

// 状态卡片
.state-card {
  margin-top: 28rpx;
  padding: 52rpx 32rpx;
  text-align: center;
  border-radius: 32rpx;
  background: linear-gradient(145deg, #fff 0%, #fff8fa 100%);
  border: 3rpx solid #ffdce9;
  box-shadow:
    0 8rpx 0 #f8d4e0,
    0 12rpx 28rpx rgba(242, 109, 168, 0.12),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.9);
}

.state-card-empty {
  margin-top: 120rpx;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  margin: 0 auto 24rpx;
  border: 4rpx solid #ffdce9;
  border-top-color: #f26da8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.state-title {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #5b2941;
}

.state-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: #9c7085;
}

.empty-action {
  display: inline-flex;
  margin-top: 28rpx;
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
  background: linear-gradient(145deg, #f58bbe 0%, #ea5f98 100%);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow:
    0 6rpx 0 #d54d82,
    0 10rpx 24rpx rgba(234, 95, 152, 0.35);
  transition: transform 0.15s ease;

  &:active {
    transform: translateY(3rpx);
    box-shadow:
      0 3rpx 0 #d54d82,
      0 6rpx 12rpx rgba(234, 95, 152, 0.25);
  }
}
</style>
