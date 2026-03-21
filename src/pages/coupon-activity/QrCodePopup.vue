<script lang="ts" setup>
defineOptions({
  name: 'QrCodePopup',
})

const props = defineProps<{
  visible: boolean
  qrToken?: string
  couponNo?: string
  couponName?: string
  couponValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const qrLoading = ref(true)
const qrImageUrl = ref('')

// 使用在线 API 生成二维码（兼容性最好）
function generateQrCode() {
  if (!props.qrToken) {
    console.warn('qrToken 为空，无法生成二维码')
    qrLoading.value = false
    return
  }

  qrLoading.value = true
  qrImageUrl.value = ''

  // 使用 QR Server API 生成二维码
  const qrContent = encodeURIComponent(props.qrToken)
  const size = 200
  // 使用免费的二维码生成 API
  qrImageUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrContent}&bgcolor=ffffff&color=5b2941&margin=10`

  // 模拟加载延迟
  setTimeout(() => {
    qrLoading.value = false
  }, 500)
}

// 监听 visible 变化
watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      generateQrCode()
    })
  }
})

// 图片加载完成
function onImageLoad() {
  qrLoading.value = false
}

// 图片加载失败
function onImageError() {
  console.error('二维码图片加载失败')
  qrLoading.value = false
}

function closePopup() {
  emit('update:visible', false)
  emit('close')
}

function stopPropagation(e: Event) {
  e.stopPropagation()
}
</script>

<template>
  <view
    v-if="visible"
    class="qr-popup-mask"
    @tap="closePopup"
  >
    <view class="qr-popup-container" @tap="stopPropagation">
      <!-- 关闭按钮 -->
      <view class="qr-popup-close" @tap="closePopup">
        <text class="close-icon">✕</text>
      </view>

      <!-- 卡片头部 -->
      <view class="qr-popup-header">
        <view class="qr-popup-badge">
          核销码
        </view>
        <view class="qr-popup-title">
          {{ couponName || '活动券码' }}
        </view>
        <view class="qr-popup-value">
          {{ couponValue }}
        </view>
      </view>

      <!-- 二维码区域 -->
      <view class="qr-popup-body">
        <view class="qr-canvas-wrap">
          <!-- 使用在线 API 生成的二维码图片 -->
          <image
            v-if="qrImageUrl"
            :src="qrImageUrl"
            class="qr-image"
            mode="aspectFit"
            @load="onImageLoad"
            @error="onImageError"
          />
          <!-- 加载状态 -->
          <view v-if="qrLoading" class="qr-loading">
            <view class="qr-loading-spinner" />
            <text>生成中...</text>
          </view>
        </view>

        <view class="qr-tips">
          <text class="qr-tips-icon">📱</text>
          <text class="qr-tips-text">请向商家出示此二维码进行核销</text>
        </view>
      </view>

      <!-- 券码信息 -->
      <view class="qr-popup-footer">
        <view class="qr-coupon-no">
          <text class="qr-coupon-label">券码：</text>
          <text class="qr-coupon-value">{{ couponNo }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.qr-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4rpx);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.qr-popup-container {
  position: relative;
  width: 100%;
  max-width: 600rpx;
  background: linear-gradient(180deg, #fff8fb 0%, #fff 100%);
  border-radius: 40rpx;
  border: 4rpx solid #ffd8e8;
  box-shadow:
    0 8rpx 0 #f5c4d8,
    0 20rpx 60rpx rgba(242, 109, 168, 0.3),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.qr-popup-close {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(242, 109, 168, 0.1);
  border-radius: 50%;
  border: 2rpx solid rgba(242, 109, 168, 0.2);
  z-index: 10;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
    background: rgba(242, 109, 168, 0.2);
  }
}

.close-icon {
  font-size: 28rpx;
  color: #f26da8;
  font-weight: 600;
}

.qr-popup-header {
  padding: 40rpx 32rpx 24rpx;
  text-align: center;
  border-bottom: 2rpx dashed #ffd8e8;
}

.qr-popup-badge {
  display: inline-block;
  padding: 8rpx 24rpx;
  background: linear-gradient(145deg, #f26da8 0%, #e85a95 100%);
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
  box-shadow: 0 4rpx 12rpx rgba(242, 109, 168, 0.3);
}

.qr-popup-title {
  margin-top: 20rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: #5b2941;
}

.qr-popup-value {
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 800;
  color: #f26da8;
  text-shadow: 0 2rpx 8rpx rgba(242, 109, 168, 0.2);
}

.qr-popup-body {
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-canvas-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  background: #fff;
  border-radius: 24rpx;
  border: 4rpx solid #ffd8e8;
  box-shadow: 0 8rpx 24rpx rgba(242, 109, 168, 0.15);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 200px;
  height: 200px;
}

.qr-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: #fff;
  z-index: 10;
  font-size: 24rpx;
  color: #9c7085;
}

.qr-loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #ffd8e8;
  border-top-color: #f26da8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.qr-tips {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 28rpx;
  padding: 16rpx 24rpx;
  background: rgba(242, 109, 168, 0.08);
  border-radius: 999rpx;
  border: 2rpx solid rgba(242, 109, 168, 0.15);
}

.qr-tips-icon {
  font-size: 28rpx;
}

.qr-tips-text {
  font-size: 24rpx;
  color: #9c7085;
  font-weight: 500;
}

.qr-popup-footer {
  padding: 24rpx 32rpx 36rpx;
  background: linear-gradient(180deg, #fff 0%, #fff5f8 100%);
  border-top: 2rpx dashed #ffd8e8;
}

.qr-coupon-no {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  border: 2rpx solid #ffd8e8;
}

.qr-coupon-label {
  font-size: 24rpx;
  color: #9c7085;
}

.qr-coupon-value {
  font-size: 26rpx;
  font-weight: 700;
  color: #5b2941;
  letter-spacing: 1rpx;
}
</style>
