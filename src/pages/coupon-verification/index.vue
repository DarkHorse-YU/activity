<script lang="ts" setup>
import type { ICouponVerificationActionRes, ICouponWriteOffPrepareData } from '@/api/types/coupon-verification'
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  confirmWriteOff,
  prepareWriteOff,
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

// 确认弹窗状态
const showConfirmModal = ref(false)
const couponInfo = ref<ICouponWriteOffPrepareData | null>(null)
const currentWriteOffMode = ref<'QR_SCAN' | 'CODE_INPUT'>('QR_SCAN')
const currentRequestNo = ref('')

// H5扫码相关
const showH5Scanner = ref(false)
const startingH5Scanner = ref(false)
let h5QrcodeScanner: Html5Qrcode | null = null
let handlingScanResult = false

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

// 格式化券类型显示
function formatCouponType(type: string) {
  return type === 'DISCOUNT' ? '折扣券' : '满减券'
}

// 格式化优惠信息显示
function formatDiscount(info: ICouponWriteOffPrepareData) {
  if (info.couponType === 'DISCOUNT' && info.discountRate) {
    return `${(info.discountRate * 10).toFixed(1)}折`
  }
  if (info.couponType === 'CASH' && info.discountAmount) {
    return `减¥${info.discountAmount}`
  }
  return '-'
}

// 关闭确认弹窗
function closeConfirmModal() {
  showConfirmModal.value = false
  couponInfo.value = null
  currentRequestNo.value = ''
}

// 确认核销
async function handleConfirmWriteOff() {
  if (!couponInfo.value || submitting.value) {
    return
  }

  try {
    submitting.value = true
    const res = await confirmWriteOff<ICouponVerificationActionRes>({
      couponNo: couponInfo.value.couponNo,
      writeOffMode: currentWriteOffMode.value,
      requestNo: currentRequestNo.value,
    })
    closeConfirmModal()
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

// 查询券信息
async function fetchCouponInfo(qrToken: string, mode: 'QR_SCAN' | 'CODE_INPUT') {
  try {
    submitting.value = true
    const res = await prepareWriteOff<ICouponWriteOffPrepareData>(qrToken)

    if (!res.canWriteOff) {
      uni.showToast({
        title: res.cannotReason || '该券无法核销',
        icon: 'none',
        duration: 2500,
      })
      return
    }

    // 显示确认弹窗，同时生成幂等性编码
    couponInfo.value = res
    currentWriteOffMode.value = mode
    currentRequestNo.value = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    showConfirmModal.value = true
  }
  catch (error) {
    console.error('查询券信息失败:', error)
    uni.showToast({ title: '查询券信息失败，请稍后重试', icon: 'none' })
  }
  finally {
    submitting.value = false
  }
}

// 输码核销
async function submitCodeVerification() {
  const couponCode = verificationCode.value.trim()
  if (!couponCode) {
    uni.showToast({ title: '请输入核销码', icon: 'none' })
    return
  }

  await fetchCouponInfo(couponCode, 'CODE_INPUT')
}

function handleCodeInputConfirm() {
  if (!submitting.value) {
    submitCodeVerification()
  }
}

// 扫码核销
function handleScanVerification() {
  if (submitting.value) {
    return
  }

  // #ifdef H5
  // H5环境使用自定义扫码
  startH5Scanner()
  // #endif

  // #ifndef H5
  // 非H5环境使用原生扫码
  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    success: async (scanRes) => {
      const scanCode = scanRes.result?.trim()
      if (!scanCode) {
        uni.showToast({ title: '未识别到有效内容', icon: 'none' })
        return
      }
      await fetchCouponInfo(scanCode, 'QR_SCAN')
    },
    fail: (error) => {
      if (error?.errMsg?.includes('cancel')) {
        return
      }
      uni.showToast({ title: '扫码失败，请稍后重试', icon: 'none' })
    },
  })
  // #endif
}

// #ifdef H5
function getH5ScannerRoot() {
  return document.getElementById('coupon-scanner-root')
}

async function ensureH5QrcodeInstance() {
  if (h5QrcodeScanner) {
    return h5QrcodeScanner
  }

  const scannerRoot = getH5ScannerRoot()
  if (!scannerRoot) {
    throw new Error('SCANNER_ROOT_NOT_FOUND')
  }

  h5QrcodeScanner = new Html5Qrcode('coupon-scanner-root', {
    verbose: false,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
    ],
    useBarCodeDetectorIfSupported: true,
  })

  return h5QrcodeScanner
}

// H5扫码 - 启动摄像头
async function startH5Scanner() {
  if (showH5Scanner.value || startingH5Scanner.value) {
    return
  }

  try {
    // 检查是否支持摄像头
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      uni.showToast({ title: '当前浏览器不支持扫码功能', icon: 'none' })
      return
    }

    startingH5Scanner.value = true
    handlingScanResult = false
    showH5Scanner.value = true

    // 等待DOM渲染
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    const scanner = await ensureH5QrcodeInstance()
    const currentState = scanner.getState()
    if (currentState !== Html5QrcodeScannerState.NOT_STARTED) {
      return
    }

    await scanner.start(
      {
        facingMode: 'environment',
      },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        disableFlip: false,
        videoConstraints: {
          facingMode: { ideal: 'environment' },
        },
      },
      (decodedText) => {
        const scanResult = decodedText.trim()
        if (!scanResult || handlingScanResult) {
          return
        }

        handlingScanResult = true
        closeH5Scanner()
        void fetchCouponInfo(scanResult, 'QR_SCAN').finally(() => {
          handlingScanResult = false
        })
      },
      () => {},
    )
  }
  catch (error: any) {
    console.error('摄像头启动失败:', error)
    closeH5Scanner()
    if (error?.name === 'NotAllowedError') {
      uni.showToast({ title: '请允许访问摄像头', icon: 'none' })
    }
    else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      uni.showToast({ title: '未检测到可用摄像头', icon: 'none' })
    }
    else if (error?.message === 'SCANNER_ROOT_NOT_FOUND') {
      uni.showToast({ title: '扫码组件初始化失败', icon: 'none' })
    }
    else {
      uni.showToast({ title: '摄像头启动失败', icon: 'none' })
    }
  }
  finally {
    startingH5Scanner.value = false
  }
}

// H5扫码 - 关闭扫码
async function closeH5Scanner() {
  showH5Scanner.value = false

  if (!h5QrcodeScanner) {
    return
  }

  const currentState = h5QrcodeScanner.getState()
  if (currentState === Html5QrcodeScannerState.SCANNING || currentState === Html5QrcodeScannerState.PAUSED) {
    try {
      await h5QrcodeScanner.stop()
    }
    catch (error) {
      console.warn('停止 H5 扫码失败:', error)
    }
  }

  try {
    h5QrcodeScanner.clear()
  }
  catch (error) {
    console.warn('清理 H5 扫码容器失败:', error)
  }

  h5QrcodeScanner = null
}

onHide(() => {
  void closeH5Scanner()
})

onBeforeUnmount(() => {
  void closeH5Scanner()
})
// #endif
</script>

<template>
  <view class="page-container">
    <view class="page-glow page-glow--top" />
    <view class="page-glow page-glow--bottom" />

    <view class="hero-panel">
      <view class="hero-head">
        <view class="hero-badge">
          Merchant Console
        </view>
        <view class="hero-status">
          核销服务已就绪
        </view>
      </view>

      <view class="hero-title">
        优惠券核销工作台
      </view>
      <view class="hero-desc">
        聚焦门店收银场景，扫码快核销，输码可兜底，记录与规则一屏直达。
      </view>
    </view>

    <view class="content-stack">
      <view class="scan-panel" @tap="handleScanVerification">
        <view class="scan-panel__content">
          <view class="panel-kicker">
            Priority Entry
          </view>
          <view class="scan-panel__title">
            扫码核销
          </view>
          <view class="scan-panel__desc">
            适合高频核销，减少人工输入错误。
          </view>
          <view class="scan-panel__tags">
            <text class="scan-tag">二维码</text>
            <text class="scan-tag">快速通过</text>
          </view>
        </view>
        <view class="scan-panel__aside">
          <view class="scan-orbit">
            <view class="scan-orbit__core">
              扫码
            </view>
          </view>
          <view class="scan-trigger">
            <text class="scan-trigger__text">立即扫码</text>
            <text class="scan-trigger__arrow">></text>
          </view>
        </view>
      </view>

      <view class="manual-panel">
        <view class="section-head">
          <view>
            <view class="section-kicker">
              Manual Backup
            </view>
            <view class="section-title">
              输码核销
            </view>
          </view>
          <view class="section-chip">
            稳定兜底
          </view>
        </view>
        <view class="manual-tip">
          适合码面损坏、设备权限受限等场景。
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
            {{ submitting ? '查询中' : '确认核销' }}
          </button>
        </view>
      </view>

      <view class="shortcut-grid">
        <view class="shortcut-card shortcut-card--records" @tap="goToRecords">
          <view class="shortcut-card__top">
            <view class="shortcut-card__icon">
              录
            </view>
            <view class="shortcut-card__arrow">
              >
            </view>
          </view>
          <view class="shortcut-card__title">
            核销记录
          </view>
          <view class="shortcut-card__desc">
            查询历史核销、进入详情、补传凭证。
          </view>
        </view>

        <view class="shortcut-card shortcut-card--rules" @tap="goToRules">
          <view class="shortcut-card__top">
            <view class="shortcut-card__icon">
              规
            </view>
            <view class="shortcut-card__arrow">
              >
            </view>
          </view>
          <view class="shortcut-card__title">
            核销规则
          </view>
          <view class="shortcut-card__desc">
            查看核销条件、处理规范与操作说明。
          </view>
        </view>
      </view>

      <view class="foot-note">
        <view class="foot-note__label">
          操作提示
        </view>
        <view class="foot-note__text">
          核销成功后，如该订单需要上传凭证，系统会自动跳转到详情页继续完成后续流程。
        </view>
      </view>
    </view>

    <!-- 确认核销弹窗 -->
    <view v-if="showConfirmModal" class="modal-overlay" @tap="closeConfirmModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-header">
          <view class="modal-title">
            确认核销
          </view>
          <view class="modal-close" @tap="closeConfirmModal">
            ×
          </view>
        </view>

        <view v-if="couponInfo" class="modal-body">
          <view class="coupon-card">
            <view class="coupon-card__header">
              <view class="coupon-type-tag">
                {{ formatCouponType(couponInfo.couponType) }}
              </view>
              <view class="coupon-discount">
                {{ formatDiscount(couponInfo) }}
              </view>
            </view>
            <view class="coupon-card__name">
              {{ couponInfo.templateName || '优惠券' }}
            </view>
            <view class="coupon-card__info">
              <view class="info-row">
                <text class="info-label">券编码</text>
                <text class="info-value">{{ couponInfo.couponNo }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">活动</text>
                <text class="info-value">{{ couponInfo.activityName }}</text>
              </view>
              <view v-if="couponInfo.thresholdAmount" class="info-row">
                <text class="info-label">使用条件</text>
                <text class="info-value">满¥{{ couponInfo.thresholdAmount }}可用</text>
              </view>
            </view>
          </view>
        </view>

        <view class="modal-footer">
          <button class="modal-btn modal-btn--cancel" @tap="closeConfirmModal">
            取消
          </button>
          <button
            class="modal-btn modal-btn--confirm"
            :class="{ loading: submitting }"
            :disabled="submitting"
            @tap="handleConfirmWriteOff"
          >
            {{ submitting ? '核销中...' : '确认核销' }}
          </button>
        </view>
      </view>
    </view>

    <!-- #ifdef H5 -->
    <!-- H5扫码弹窗 -->
    <view v-show="showH5Scanner" class="scanner-overlay">
      <view class="scanner-header">
        <view class="scanner-title">
          扫描二维码
        </view>
        <view class="scanner-close" @tap="closeH5Scanner">
          ×
        </view>
      </view>
      <div class="scanner-body">
        <div class="scanner-stage">
          <div id="coupon-scanner-root" class="scanner-root" />
        </div>
      </div>
      <view class="scanner-tip">
        将二维码放入框内，即可自动扫描
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 32rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #f6f4ee 0%, #f2efe6 22%, #f7f6f1 52%, #fcfbf8 100%);
}

.page-glow {
  position: absolute;
  border-radius: 999rpx;
  filter: blur(26rpx);
  opacity: 0.85;
  pointer-events: none;
}

.page-glow--top {
  top: -90rpx;
  right: -40rpx;
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(232, 180, 74, 0.34) 0%, rgba(232, 180, 74, 0) 72%);
}

.page-glow--bottom {
  left: -120rpx;
  bottom: 240rpx;
  width: 340rpx;
  height: 340rpx;
  background: radial-gradient(circle, rgba(24, 91, 78, 0.18) 0%, rgba(24, 91, 78, 0) 72%);
}

.hero-panel {
  position: relative;
  z-index: 1;
  padding: 14rpx 2rpx 0;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  letter-spacing: 1rpx;
  font-weight: 700;
  background: rgba(24, 91, 78, 0.1);
  color: #185b4e;
  border: 1rpx solid rgba(24, 91, 78, 0.14);
}

.hero-status {
  flex-shrink: 0;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: #7c5a10;
  background: rgba(232, 180, 74, 0.16);
  border: 1rpx solid rgba(232, 180, 74, 0.22);
}

.hero-title {
  margin-top: 28rpx;
  font-size: 62rpx;
  font-weight: 800;
  line-height: 1.12;
  color: #1d1a16;
}

.hero-desc {
  margin-top: 18rpx;
  max-width: 640rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #5f5a52;
}

.content-stack {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 24rpx;
}

.scan-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 34rpx 30rpx;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at top right, rgba(232, 180, 74, 0.22), transparent 30%),
    linear-gradient(135deg, #123c35 0%, #0d2924 62%, #081917 100%);
  box-shadow: 0 22rpx 52rpx rgba(9, 30, 28, 0.22);
}

.scan-panel:active,
.shortcut-card:active,
.submit-btn:active {
  transform: scale(0.985);
}

.scan-panel__content {
  flex: 1;
}

.panel-kicker,
.section-kicker {
  font-size: 20rpx;
  letter-spacing: 1.5rpx;
  text-transform: uppercase;
}

.panel-kicker {
  color: rgba(232, 235, 228, 0.66);
}

.scan-panel__title {
  margin-top: 16rpx;
  font-size: 44rpx;
  font-weight: 800;
  color: #fffdf7;
}

.scan-panel__desc {
  margin-top: 25rpx;
  max-width: 420rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: rgba(239, 236, 231, 0.78);
}

.scan-panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 40rpx;
}

.scan-tag {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  color: #f7edd1;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.scan-panel__aside {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.scan-orbit {
  width: 168rpx;
  height: 168rpx;
  padding: 14rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, rgba(232, 180, 74, 0.56), rgba(255, 255, 255, 0.08));
}

.scan-orbit__core {
  width: 100%;
  height: 100%;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(250, 248, 242, 0.22), rgba(255, 255, 255, 0.06));
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  font-size: 32rpx;
  font-weight: 800;
  color: #fffdf7;
}

.scan-trigger {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 26rpx;
  border-radius: 999rpx;
  background: #f3ead1;
  box-shadow: 0 10rpx 20rpx rgba(8, 25, 23, 0.16);
}

.scan-trigger__text {
  font-size: 26rpx;
  font-weight: 800;
  color: #0e2b26;
}

.scan-trigger__arrow {
  font-size: 26rpx;
  font-weight: 800;
  color: #0e2b26;
}

.manual-panel {
  padding: 30rpx 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 16rpx 38rpx rgba(45, 36, 23, 0.08);
  backdrop-filter: blur(12rpx);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.section-kicker {
  color: #8a7f72;
}

.section-chip {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #185b4e;
  background: rgba(24, 91, 78, 0.08);
}

.section-title {
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: #1d1a16;
}

.manual-tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6d655a;
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
  background: #fbfaf7;
  border: 2rpx solid #e7dfd0;
  font-size: 28rpx;
  color: #1d1a16;
}

.input-placeholder {
  color: #a19688;
}

.submit-btn {
  width: 214rpx;
  height: 92rpx;
  padding: 0;
  border: none;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #1b6758 0%, #0f3f37 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 800;
  color: #faf7f0;
  box-shadow: 0 14rpx 24rpx rgba(16, 64, 55, 0.2);

  &.loading {
    opacity: 0.75;
  }

  &::after {
    border: none;
  }
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.shortcut-card {
  min-height: 220rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 16rpx 34rpx rgba(48, 38, 24, 0.07);
}

.shortcut-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shortcut-card__icon {
  width: 74rpx;
  height: 74rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 800;
}

.shortcut-card__arrow {
  font-size: 28rpx;
  color: #9b9388;
}

.shortcut-card__title {
  margin-top: 28rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: #1d1a16;
}

.shortcut-card__desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6f665b;
}

.shortcut-card--records {
  background: linear-gradient(180deg, rgba(244, 249, 247, 0.98), rgba(255, 255, 255, 0.94));

  .shortcut-card__icon {
    background: linear-gradient(135deg, #d7ede6 0%, #eef7f3 100%);
    color: #185b4e;
  }
}

.shortcut-card--rules {
  background: linear-gradient(180deg, rgba(255, 248, 234, 0.98), rgba(255, 255, 255, 0.94));

  .shortcut-card__icon {
    background: linear-gradient(135deg, #f8e3a8 0%, #fff4d3 100%);
    color: #8c6511;
  }
}

.foot-note {
  padding: 24rpx 26rpx;
  border-radius: 28rpx;
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 10rpx 24rpx rgba(50, 40, 27, 0.05);
}

.foot-note__label {
  font-size: 22rpx;
  font-weight: 700;
  color: #185b4e;
}

.foot-note__text {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6d655a;
}

// 确认弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 36rpx;
  border-bottom: 1rpx solid #f0ede6;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1d1a16;
}

.modal-close {
  font-size: 48rpx;
  color: #9b9388;
  line-height: 1;
  padding: 8rpx;
}

.modal-body {
  padding: 32rpx 36rpx;
}

.coupon-card {
  background: linear-gradient(135deg, #185b4e 0%, #0f3f37 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #fff;
}

.coupon-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.coupon-type-tag {
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #f7edd1;
}

.coupon-discount {
  font-size: 48rpx;
  font-weight: 800;
  color: #f3ead1;
}

.coupon-card__name {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  color: #fffdf7;
}

.coupon-card__info {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  padding: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  }
}

.info-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.info-value {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 36rpx 36rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}

.modal-btn--cancel {
  background: #f5f2eb;
  color: #6d655a;
}

.modal-btn--confirm {
  background: linear-gradient(135deg, #1b6758 0%, #0f3f37 100%);
  color: #faf7f0;
  box-shadow: 0 10rpx 24rpx rgba(16, 64, 55, 0.25);

  &.loading {
    opacity: 0.7;
  }
}

@media (max-width: 680rpx) {
  .shortcut-grid {
    grid-template-columns: 1fr;
  }

  .scan-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .scan-panel__desc {
    max-width: none;
  }

  .scan-panel__aside {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .manual-form {
    flex-direction: column;
  }

  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 520rpx) {
  .hero-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 52rpx;
  }

  .scan-orbit {
    width: 144rpx;
    height: 144rpx;
  }
}

// H5扫码弹窗样式
.scanner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.scanner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 32rpx;
  padding-top: calc(40rpx + env(safe-area-inset-top));
  background: rgba(0, 0, 0, 0.6);
}

.scanner-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
}

.scanner-close {
  font-size: 56rpx;
  color: #fff;
  line-height: 1;
  padding: 8rpx;
}

.scanner-body {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 300px;
  padding: 48rpx 32rpx;
}

.scanner-stage {
  position: relative;
  width: min(78vw, 560rpx);
  max-width: 560rpx;
  aspect-ratio: 3 / 4;
  max-height: 70vh;
  overflow: hidden;
  border-radius: 28rpx;
  background: #050505;
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.28);
}

.scanner-root {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  border-radius: 28rpx;
}

:deep(#coupon-scanner-root) {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
  border-radius: 28rpx;
}

:deep(#coupon-scanner-root > div) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 28rpx;
}

:deep(#coupon-scanner-root video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  background: #000;
  border-radius: 28rpx;
}

:deep(#coupon-scanner-root canvas) {
  display: none !important;
}

:deep(#coupon-scanner-root video)::-webkit-media-controls {
  display: none !important;
}

:deep(#coupon-scanner-root video)::-webkit-media-controls-enclosure {
  display: none !important;
}

:deep(#coupon-scanner-root video)::-webkit-media-controls-panel {
  display: none !important;
}

:deep(#coupon-scanner-root #qr-shaded-region) {
  display: none !important;
}

.scanner-tip {
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  text-align: center;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.6);
}
</style>
