<script lang="ts" setup>
import type { CouponTemplateItem } from '@/api/coupon-activity'
import {
  claimCoupon,
  getCouponTemplates,
} from '@/api/coupon-activity'
import Verify from '@/components/verifition/Verify.vue'

defineOptions({
  name: 'CouponActivityHome',
})

definePage({
  style: {
    navigationBarTitleText: '抢券活动',
  },
})

const couponList = ref<CouponTemplateItem[]>([])
const loading = ref(true)
const verifyRef = ref<InstanceType<typeof Verify> | null>(null)
const currentClaimCoupon = ref<CouponTemplateItem | null>(null)
const claiming = ref(false)
const sidebarCollapsed = ref(false)

const sidebarActions = [
  {
    key: 'codes',
    titleTop: '我的',
    titleBottom: '券码',
    accentClass: 'sidebar-btn-codes',
  },
  {
    key: 'rules',
    titleTop: '活动',
    titleBottom: '规则',
    accentClass: 'sidebar-btn-rules',
  },
] as const

// 获取优惠券列表
async function fetchCouponList() {
  loading.value = true
  try {
    const res = await getCouponTemplates(1)
    couponList.value = res || []
  }
  catch (error) {
    console.error('获取优惠券列表失败', error)
  }
  finally {
    loading.value = false
  }
}

// 点击领取按钮
function handleClaim(coupon: CouponTemplateItem) {
  if (!coupon.canClaim) {
    uni.showToast({
      title: coupon.cannotClaimReason || '暂不可领取',
      icon: 'none',
    })
    return
  }

  // 记录当前要领取的优惠券
  currentClaimCoupon.value = coupon
  // 弹出验证码
  verifyRef.value?.show()
}

// 验证码验证成功回调
async function handleVerifySuccess(params: { captchaVerification: string }) {
  if (!currentClaimCoupon.value || claiming.value)
    return

  claiming.value = true
  try {
    await claimCoupon({
      templateId: currentClaimCoupon.value.id,
      captchaToken: params.captchaVerification,
    })

    uni.showToast({
      title: '领取成功',
      icon: 'success',
    })

    // 刷新列表更新状态
    await fetchCouponList()
  }
  catch (error: any) {
    uni.showToast({
      title: error?.message || '领取失败',
      icon: 'none',
    })
  }
  finally {
    claiming.value = false
    currentClaimCoupon.value = null
  }
}

// 格式化优惠券金额显示（包含符号）
function formatCouponAmount(coupon: CouponTemplateItem) {
  if (coupon.couponType === 'DISCOUNT') {
    // discountRate 0.90 表示九折
    const discount = (coupon.discountRate || 1) * 10
    return discount >= 10 ? `${discount / 10}折` : `${discount}折`
  }
  return `¥${coupon.discountAmount}`
}

// 格式化门槛
function formatThreshold(coupon: CouponTemplateItem) {
  if (coupon.couponType === 'DISCOUNT') {
    return '全场通用'
  }
  if (coupon.thresholdAmount && coupon.thresholdAmount > 0) {
    return `满${coupon.thresholdAmount}可用`
  }
  return '无门槛'
}

// 计算剩余库存百分比
function getStockPercent(coupon: CouponTemplateItem) {
  if (coupon.totalStock === 0)
    return 0
  return Math.round((coupon.remainingStock / coupon.totalStock) * 100)
}

onMounted(() => {
  fetchCouponList()
})

function handleSidebarAction(type: 'codes' | 'rules') {
  const url = type === 'codes'
    ? '/pages/coupon-activity/my-coupons'
    : '/pages/coupon-activity/rules'

  uni.navigateTo({
    url,
  })
}

function toggleSidebarCollapsed() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <view class="page-container">
    <!-- 顶部占位区域（为"活动专区"文字留空） -->
    <view class="header-spacer" />

    <!-- 优惠券列表区域 -->
    <view class="coupon-section">
      <view v-if="loading" class="loading-wrap">
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <template v-else>
        <view
          v-for="coupon in couponList"
          :key="coupon.id"
          class="coupon-card"
        >
          <!-- 左侧金额区域 -->
          <view class="coupon-left">
            <view class="coupon-amount">
              <text class="amount-value">
                {{ formatCouponAmount(coupon) }}
              </text>
            </view>
            <view class="coupon-threshold">
              {{ formatThreshold(coupon) }}
            </view>
          </view>

          <!-- 右侧信息区域 -->
          <view class="coupon-right">
            <view class="coupon-name">
              {{ coupon.templateName }}
            </view>
            <view class="coupon-desc">
              {{ coupon.description }}
            </view>
            <view class="coupon-stock">
              <view class="stock-bar">
                <view
                  class="stock-fill"
                  :style="{ width: `${getStockPercent(coupon)}%` }"
                />
              </view>
              <text class="stock-text">
                剩余{{ coupon.remainingStock }}张
              </text>
            </view>
          </view>

          <!-- 领取按钮 -->
          <view
            class="coupon-btn"
            :class="{ disabled: !coupon.canClaim }"
            @tap="handleClaim(coupon)"
          >
            {{ coupon.canClaim ? '抢' : '已领' }}
          </view>
        </view>

        <view v-if="couponList.length === 0" class="empty-wrap">
          <text class="empty-text">
            暂无优惠券
          </text>
        </view>
      </template>
    </view>

    <view
      class="sidebar-fab-group"
    >
      <view class="sidebar-collapse-handle" @tap="toggleSidebarCollapsed">
        {{ sidebarCollapsed ? '展开' : '收起' }}
      </view>
      <view
        class="sidebar-fab-list"
        :class="{ 'sidebar-fab-list-collapsed': sidebarCollapsed }"
      >
        <view
          v-for="action in sidebarActions"
          :key="action.key"
          class="sidebar-fab"
          :class="action.accentClass"
          @tap="handleSidebarAction(action.key)"
        >
          <text class="sidebar-fab-title">
            {{ action.titleTop }}
          </text>
          <text class="sidebar-fab-title">
            {{ action.titleBottom }}
          </text>
        </view>
      </view>
    </view>

    <!-- 行为验证码弹窗 -->
    <Verify
      ref="verifyRef"
      captcha-type="blockPuzzle"
      mode="pop"
      @success="handleVerifySuccess"
    />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100vh;
  background: url('http://124.221.55.156:9000/xiaoyu/coupon/index.png') no-repeat center top;
  background-size: 100% 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header-spacer {
  flex-shrink: 0;
  height: 1000rpx; // 为"活动专区"区域留空，可根据实际调整
}

.coupon-section {
  flex: 1;
  padding: 0 50rpx 36rpx;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.loading-wrap {
  padding: 80rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.empty-wrap {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

// 可爱卡通风格优惠券卡片 - 粉色系
.coupon-card {
  display: flex;
  align-items: stretch;
  margin-bottom: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow:
    0 8rpx 32rpx rgba(242, 109, 168, 0.18),
    0 4rpx 16rpx rgba(242, 109, 168, 0.1);
  position: relative;
  border: 3rpx solid #ffd6e7;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:active {
    transform: scale(0.98);
  }

  // 左侧波浪锯齿装饰
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 180rpx;
    width: 24rpx;
    height: 24rpx;
    background: #7dd3fc;
    border-radius: 50%;
    z-index: 2;
  }

  &::before {
    top: -12rpx;
  }

  &::after {
    bottom: -12rpx;
  }
}

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

  // 装饰星星
  &::before {
    content: '★';
    position: absolute;
    top: 16rpx;
    left: 12rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
  }

  // 装饰星星
  &::after {
    content: '✦';
    position: absolute;
    bottom: 16rpx;
    right: 12rpx;
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.4);
  }
}

.coupon-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.amount-value {
  font-size: 56rpx;
  font-weight: 800;
  line-height: 1;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(180, 50, 90, 0.3);
  letter-spacing: -2rpx;
}

.coupon-threshold {
  margin-top: 12rpx;
  font-size: 22rpx;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(4rpx);
}

.coupon-right {
  flex: 1;
  padding: 28rpx 100rpx 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  background: linear-gradient(180deg, #fff6f8 0%, #ffeef2 100%);
  position: relative;
}

.coupon-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #4a2a3d;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 1rpx;
}

.coupon-desc {
  font-size: 24rpx;
  color: #9a7080;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-stock {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.stock-bar {
  width: 100rpx;
  height: 12rpx;
  background: #ffdce4;
  border-radius: 6rpx;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  background: linear-gradient(90deg, #f26da8 0%, #e85a95 100%);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.stock-text {
  font-size: 22rpx;
  color: #f26da8;
  font-weight: 600;
}

.coupon-btn {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  padding: 16rpx 24rpx;
  background: linear-gradient(145deg, #f26da8 0%, #e85a95 100%);
  border-radius: 40rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
  box-shadow:
    0 6rpx 16rpx rgba(242, 109, 168, 0.35),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
  transition: all 0.25s ease;

  &:active {
    transform: translateY(-50%) scale(0.95);
    box-shadow:
      0 3rpx 8rpx rgba(242, 109, 168, 0.3),
      inset 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
  }

  &.disabled {
    background: linear-gradient(145deg, #c8c8c8 0%, #a8a8a8 100%);
    box-shadow: none;
    pointer-events: none;
  }
}

.sidebar-fab-group {
  position: fixed;
  right: -18rpx;
  top: 56%;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  transform: translateY(-50%);
}

.sidebar-fab-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}

.sidebar-fab-list-collapsed {
  transform: translateX(72rpx);
  opacity: 0.15;
}

.sidebar-collapse-handle {
  align-self: flex-end;
  min-width: 56rpx;
  padding: 14rpx 12rpx;
  border-radius: 22rpx 0 0 22rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 2rpx solid rgba(242, 109, 168, 0.22);
  box-shadow: 0 10rpx 22rpx rgba(210, 84, 142, 0.16);
  text-align: center;
  font-size: 20rpx;
  font-weight: 700;
  color: #d95b96;
}

.sidebar-fab {
  width: 84rpx;
  min-height: 88rpx;
  padding: 12rpx 10rpx;
  border-radius: 24rpx 0 0 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 10rpx 22rpx rgba(210, 84, 142, 0.24),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #fff;
  backdrop-filter: blur(6rpx);

  &:active {
    transform: translateX(-4rpx) scale(0.97);
  }
}

.sidebar-btn-codes {
  background: linear-gradient(180deg, #f58bbe 0%, #ec5d97 100%);
}

.sidebar-btn-rules {
  background: linear-gradient(180deg, #86d7ff 0%, #5db9ff 100%);
}

.sidebar-fab-title {
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
}
</style>
