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
    <view class="hero-panel">
      <view class="hero-badge">
        商家端
      </view>
      <view class="hero-title">
        优惠券核销
      </view>
      <view class="hero-desc">
        扫码优先，输码备用
      </view>
    </view>

    <view class="control-stack">
      <view class="scan-panel" @tap="handleScanVerification">
        <view class="scan-panel__icon">
          扫
        </view>
        <view class="scan-panel__title">
          扫码核销
        </view>
        <view class="scan-panel__desc">
          扫描二维码或条形码
        </view>
        <view class="scan-trigger">
          <text class="scan-trigger__text">立即扫码</text>
          <text class="scan-trigger__arrow">></text>
        </view>
      </view>

      <view class="manual-panel">
        <view class="section-title">
          输码核销
        </view>
        <view class="manual-form">
          <input
            v-model="verificationCode"
            class="code-input"
            placeholder="请输入券码或核销码"
            placeholder-class="input-placeholder"
            confirm-type="done"
            @confirm="handleCodeInputConfirm"
          >
          <button
            class="submit-btn"
            :class="{ loading: submitting }"
            :disabled="submitting"
            @tap="submitCodeVerification"
          >
            {{ submitting ? '核销中' : '确认' }}
          </button>
        </view>
      </view>

      <view class="action-list">
        <view class="action-row records-card" @tap="goToRecords">
          <view class="action-row__icon">
            录
          </view>
          <view class="action-row__content">
            <view class="action-row__title">
              核销记录
            </view>
            <view class="action-row__desc">
              查看历史记录
            </view>
          </view>
          <view class="action-row__arrow">
            >
          </view>
        </view>

        <view class="action-row rules-card" @tap="goToRules">
          <view class="action-row__icon">
            规
          </view>
          <view class="action-row__content">
            <view class="action-row__title">
              规则说明
            </view>
            <view class="action-row__desc">
              查看核销规则
            </view>
          </view>
          <view class="action-row__arrow">
            >
          </view>
        </view>
      </view>

      <view class="foot-note">
        <view class="foot-note__label">
          提示
        </view>
        <view class="foot-note__text">
          核销成功后，如需上传凭证将自动跳转详情页。
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 28rpx 24rpx calc(44rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 28%),
    linear-gradient(180deg, #f0f9ff 0%, #f8fcff 36%, #ffffff 100%);
}

.hero-panel {
  padding: 20rpx 6rpx 8rpx;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  background: #e0f2fe;
  color: #0369a1;
}

.hero-title {
  margin-top: 22rpx;
  font-size: 56rpx;
  font-weight: 800;
  line-height: 1.12;
  color: #0f172a;
}

.hero-desc {
  margin-top: 14rpx;
  font-size: 25rpx;
  color: #475569;
}

.control-stack {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 20rpx;
}

.scan-panel,
.manual-panel,
.action-row,
.foot-note {
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 14rpx 38rpx rgba(15, 23, 42, 0.08);
}

.scan-panel {
  padding: 38rpx 30rpx 32rpx;
  background: linear-gradient(180deg, #0f172a 0%, #1d4ed8 100%);
  text-align: center;
}

.scan-panel:active,
.action-row:active {
  transform: scale(0.985);
}

.scan-panel__icon {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 46rpx;
  font-weight: 800;
  color: #ecfeff;
}

.scan-panel__title {
  margin-top: 24rpx;
  font-size: 42rpx;
  font-weight: 800;
  color: #f8fafc;
}

.scan-panel__desc {
  margin-top: 10rpx;
  font-size: 25rpx;
  color: rgba(236, 254, 255, 0.82);
}

.scan-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 28rpx;
  padding: 18rpx 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
}

.scan-trigger__text {
  font-size: 26rpx;
  font-weight: 800;
  color: #1d4ed8;
}

.scan-trigger__arrow {
  font-size: 26rpx;
  font-weight: 800;
  color: #1d4ed8;
}

.manual-panel {
  padding: 28rpx;
  border: 2rpx solid rgba(14, 165, 233, 0.12);
}

.section-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
  text-align: left;
}

.manual-form {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.code-input {
  flex: 1;
  height: 92rpx;
  padding: 0 26rpx;
  border-radius: 22rpx;
  background: #f8fafc;
  border: 2rpx solid #dbeafe;
  font-size: 28rpx;
  color: #0f172a;
}

.input-placeholder {
  color: #94a3b8;
}

.submit-btn {
  width: 188rpx;
  height: 92rpx;
  padding: 0;
  border: none;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #0f766e 0%, #10b981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 800;
  color: #f0fdfa;
  box-shadow: 0 12rpx 24rpx rgba(15, 118, 110, 0.16);

  &.loading {
    opacity: 0.75;
  }

  &::after {
    border: none;
  }
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx 26rpx;
}

.action-row__icon {
  width: 70rpx;
  height: 70rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 800;
}

.action-row__content {
  flex: 1;
}

.action-row__title {
  font-size: 30rpx;
  font-weight: 800;
  color: #111827;
}

.action-row__desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #6b7280;
}

.action-row__arrow {
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: #94a3b8;
}

.records-card {
  border: 2rpx solid rgba(37, 99, 235, 0.1);

  .action-row__icon {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1d4ed8;
  }
}

.rules-card {
  border: 2rpx solid rgba(245, 158, 11, 0.12);

  .action-row__icon {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #b45309;
  }
}

.foot-note {
  padding: 22rpx 24rpx;
  border: 2rpx solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.78);
}

.foot-note__label {
  font-size: 20rpx;
  font-weight: 700;
  color: #0ea5e9;
}

.foot-note__text {
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #475569;
}

@media (max-width: 680rpx) {
  .manual-form {
    flex-direction: column;
  }

  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 520rpx) {
  .hero-title {
    font-size: 48rpx;
  }
}
</style>
