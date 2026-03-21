<template>
  <view v-show="isVisible" :class="mode === 'pop' ? 'mask' : ''">
    <view
      class="verifybox"
      :class="mode === 'pop' ? '' : 'verifybox-fixed'"
      :style="{ maxWidth: `${parseInt(imgSize.width) + 60}px` }"
    >
      <view v-if="mode === 'pop'" class="verifybox-top">
        请完成安全验证
        <text class="verifybox-close" @tap="closeBox">✕</text>
      </view>
      <view class="verifybox-bottom" :style="{ padding: mode === 'pop' ? '30rpx' : '0' }">
        <VerifySlide
          v-if="componentType === 'VerifySlide'"
          ref="instanceRef"
          :captcha-type="captchaType"
          :type="verifyType"
          :mode="mode"
          :vertical-space="props.vSpace"
          :explain="explain"
          :img-size="imgSize"
          :block-size="blockSize"
          :bar-size="barSize"
          @success="handleSuccess"
          @error="handleError"
          @ready="handleReady"
        />
        <VerifyPoints
          v-if="componentType === 'VerifyPoints'"
          ref="instanceRef"
          :captcha-type="captchaType"
          :mode="mode"
          :vertical-space="props.vSpace"
          :img-size="imgSize"
          :bar-size="barSize"
          @success="handleSuccess"
          @error="handleError"
          @ready="handleReady"
        />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import VerifyPoints from './Verify/VerifyPoints.vue'
import VerifySlide from './Verify/VerifySlide.vue'

interface Props {
  captchaType?: 'blockPuzzle' | 'clickWord'
  mode?: 'pop' | 'fixed'
  vSpace?: number
  explain?: string
  imgSize?: { width: string, height: string }
  blockSize?: { width: string, height: string }
  barSize?: { width: string, height: string }
}

const props = withDefaults(defineProps<Props>(), {
  captchaType: 'blockPuzzle',
  mode: 'pop',
  vSpace: 5,
  explain: '向右滑动完成验证',
  imgSize: () => ({ width: '310px', height: '155px' }),
  blockSize: () => ({ width: '50px', height: '50px' }),
  barSize: () => ({ width: '310px', height: '40px' }),
})

const emit = defineEmits<{
  (e: 'success', params: { captchaVerification: string }): void
  (e: 'error', instance: any): void
  (e: 'ready', instance: any): void
}>()

const showBox = ref(props.mode === 'fixed')
const instanceRef = ref<any>(null)

// fixed 模式常驻显示，pop 模式由 show/closeBox 控制
const isVisible = computed(() => props.mode === 'fixed' || showBox.value)

// 当前仅使用图片验证码模式
const verifyType = '2'

// 组件类型
const componentType = computed(() => {
  return props.captchaType === 'blockPuzzle' ? 'VerifySlide' : 'VerifyPoints'
})

// 显示验证码弹窗
function show() {
  showBox.value = true
}

// 关闭弹窗
function closeBox() {
  showBox.value = false
}

// 验证成功回调
function handleSuccess(params: { captchaVerification: string }) {
  emit('success', params)
  if (props.mode === 'pop') {
    setTimeout(() => {
      closeBox()
    }, 1500)
  }
}

// 验证失败回调
function handleError(instance: any) {
  emit('error', instance)
}

// 组件就绪回调
function handleReady(instance: any) {
  emit('ready', instance)
}

// 刷新验证码
function refresh() {
  instanceRef.value?.refresh()
}

// 暴露方法
defineExpose({
  show,
  closeBox,
  refresh,
})
</script>

<style lang="scss" scoped>
.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verifybox {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);

  &.verifybox-fixed {
    position: relative;
    box-shadow: none;
    border-radius: 0;
  }
}

.verifybox-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  background: #f7f9fa;
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  border-bottom: 1rpx solid #eee;
}

.verifybox-close {
  font-size: 36rpx;
  color: #999;
  cursor: pointer;
  padding: 0 10rpx;
}

.verifybox-bottom {
  // padding 由内联样式控制
}
</style>
