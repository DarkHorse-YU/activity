<script lang="ts" setup>
import type { ICouponVerificationActionRes } from '@/api/types/coupon-verification'
import {
  verifyCouponByCode,
  verifyCouponByScan,
} from '@/api/coupon-verification'

defineOptions({
  name: 'CouponVerificationHome',
})

definePage({
  style: {
    navigationBarTitleText: '优惠券核销',
  },
})

const verificationCode = ref('')
const submitting = ref(false)

function goToRecords() {
  uni.navigateTo({ url: '/pages/coupon-verification/records' })
}

function goToRules() {
  uni.navigateTo({ url: '/pages/coupon-verification/rules' })
}

function goToDetail(recordId: number, needVoucher: boolean) {
  const mode = needVoucher ? 'create' : 'detail'
  uni.navigateTo({ url: `/pages/coupon-verification/detail?id=${recordId}&mode=${mode}` })
}

function handleVerificationSuccess(res: ICouponVerificationActionRes) {
  uni.showToast({
    title: res.message || '核销成功',
    icon: 'success',
  })

  setTimeout(() => {
    if (res.recordId) {
      goToDetail(res.recordId, !!res.needVoucher)
      return
    }
    goToRecords()
  }, 1200)
}

async function submitCodeVerification() {
  const couponCode = verificationCode.value.trim()
  if (!couponCode) {
    uni.showToast({ title: '请输入核销码', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    const res = await verifyCouponByCode<ICouponVerificationActionRes>({ couponCode })
    handleVerificationSuccess(res)
  }
  catch (error) {
    console.error('核销失败:', error)
    uni.showToast({ title: '核销失败，请稍后重试', icon: 'none' })
  }
  finally {
    submitting.value = false
  }
}

function handleCodeInputConfirm() {
  if (!submitting.value) {
    submitCodeVerification()
  }
}

function handleScanVerification() {
  if (submitting.value) {
    return
  }

  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    success: async (scanRes) => {
      const scanCode = scanRes.result?.trim()
      if (!scanCode) {
        uni.showToast({ title: '未识别到有效内容', icon: 'none' })
        return
      }

      try {
        submitting.value = true
        const res = await verifyCouponByScan<ICouponVerificationActionRes>({
          scanCode,
        })
        handleVerificationSuccess(res)
      }
      catch (error) {
        console.error('扫码核销失败:', error)
        uni.showToast({ title: '扫码核销失败，请稍后重试', icon: 'none' })
      }
      finally {
        submitting.value = false
      }
    },
    fail: (error) => {
      if (error?.errMsg?.includes('cancel')) {
        return
      }
      uni.showToast({ title: '扫码失败，请稍后重试', icon: 'none' })
    },
  })
}
</script>

<template>
  <view class="page-container">
    <view class="hero-card">
      <view class="hero-tag">
        Merchant
      </view>
      <view class="hero-title">
        优惠券核销工作台
      </view>
      <view class="hero-desc">
        商家在这里完成核销、补传凭证和规则查看。核销成功后，如需上传凭证会自动进入对应详情页。
      </view>
    </view>

    <view class="action-panel">
      <view class="panel-title">
        开始核销
      </view>

      <view class="scan-entry" @tap="handleScanVerification">
        <view>
          <view class="entry-title">
            扫码核销
          </view>
          <view class="entry-subtitle">
            扫描用户二维码，快速完成核销
          </view>
        </view>
        <view class="entry-arrow">
          >
        </view>
      </view>

      <view class="manual-card">
        <view class="manual-title">
          输入核销码
        </view>
        <input
          v-model="verificationCode"
          class="manual-input"
          placeholder="请输入券码或核销码"
          placeholder-class="manual-placeholder"
          confirm-type="done"
          @confirm="handleCodeInputConfirm"
        >
        <view class="manual-button" :class="{ disabled: submitting }" @tap="submitCodeVerification">
          {{ submitting ? '提交中...' : '确认核销' }}
        </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-card" @tap="goToRecords">
        <view>
          <view class="entry-title">
            核销记录
          </view>
          <view class="entry-subtitle">
            查看历史核销状态和凭证处理进度
          </view>
        </view>
        <view class="entry-arrow">
          >
        </view>
      </view>

      <view class="menu-card secondary" @tap="goToRules">
        <view>
          <view class="entry-title">
            规则说明
          </view>
          <view class="entry-subtitle">
            查看核销规范、凭证要求和异常说明
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
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background:
    radial-gradient(circle at top right, rgba(22, 163, 74, 0.16), transparent 30%),
    linear-gradient(180deg, #f4fbf6 0%, #eef9f1 35%, #ffffff 100%);
}

.hero-card,
.action-panel,
.menu-card,
.manual-card,
.scan-entry {
  border-radius: 28rpx;
}

.hero-card {
  padding: 36rpx 32rpx;
  background: linear-gradient(135deg, #14532d 0%, #15803d 55%, #22c55e 100%);
  box-shadow: 0 18rpx 48rpx rgba(20, 83, 45, 0.2);
}

.hero-tag {
  display: inline-flex;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.14);
  color: #f0fdf4;
  font-size: 22rpx;
}

.hero-title {
  margin-top: 20rpx;
  font-size: 46rpx;
  font-weight: 700;
  color: #fff;
}

.hero-desc {
  margin-top: 16rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: rgba(240, 253, 244, 0.92);
}

.action-panel {
  margin-top: 28rpx;
  padding: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
}

.panel-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.scan-entry,
.menu-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  background: #f6fbf7;
  border: 2rpx solid rgba(34, 197, 94, 0.08);
}

.scan-entry {
  margin-top: 24rpx;
}

.manual-card {
  margin-top: 20rpx;
  padding: 24rpx;
  background: #f8fafc;
}

.manual-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.manual-input {
  height: 88rpx;
  margin-top: 18rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: #fff;
  font-size: 28rpx;
  border: 2rpx solid rgba(148, 163, 184, 0.14);
  box-sizing: border-box;
}

.manual-placeholder {
  color: #94a3b8;
}

.manual-button {
  margin-top: 18rpx;
  height: 84rpx;
  border-radius: 42rpx;
  background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;

  &.disabled {
    opacity: 0.7;
  }
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 24rpx;
}

.menu-card.secondary {
  background: #ffffff;
}

.entry-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.entry-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #64748b;
}

.entry-arrow {
  font-size: 34rpx;
  font-weight: 700;
  color: #16a34a;
}
</style>
