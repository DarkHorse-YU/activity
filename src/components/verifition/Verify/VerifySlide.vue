<template>
  <view class="verify-slide">
    <view
      v-if="type === '2'"
      class="verify-img-out"
      :style="{ height: `${parseInt(setSize.imgHeight) + verticalSpace}px` }"
    >
      <view
        class="verify-img-panel"
        :style="{ width: setSize.imgWidth, height: setSize.imgHeight }"
      >
        <image
          v-if="backImgBase"
          :src="`data:image/png;base64,${backImgBase}`"
          class="verify-img"
          mode="scaleToFill"
        />
        <view v-show="showRefresh" class="verify-refresh" @tap="refresh">
          <text class="icon-refresh">⟳</text>
        </view>
        <view v-if="tipWords" class="verify-tips" :class="passFlag ? 'suc-bg' : 'err-bg'">
          {{ tipWords }}
        </view>
      </view>
    </view>

    <!-- 滑动条区域 -->
    <view
      class="verify-bar-area"
      :style="{ width: setSize.imgWidth, height: barSize.height, lineHeight: barSize.height }"
    >
      <text class="verify-msg">{{ text }}</text>
      <view
        class="verify-left-bar"
        :style="{
          width: leftBarWidth !== undefined ? leftBarWidth : barSize.height,
          height: barSize.height,
          borderColor: leftBarBorderColor,
          transition: transitionWidth,
        }"
      >
        <text class="verify-msg">{{ finishText }}</text>
        <view
          class="verify-move-block"
          :style="{
            width: barSize.height,
            height: barSize.height,
            backgroundColor: moveBlockBackgroundColor,
            left: moveBlockLeft,
            transition: transitionLeft,
          }"
          @touchstart="start"
          @touchmove.prevent="move"
          @touchend="end"
          @mousedown="start"
        >
          <text class="verify-icon" :style="{ color: iconColor }">{{ iconClass }}</text>
          <view
            v-if="type === '2'"
            class="verify-sub-block"
            :style="{
              width: blockSize.width,
              height: setSize.imgHeight,
              top: `-${parseInt(setSize.imgHeight) + verticalSpace}px`,
              backgroundSize: `${setSize.imgWidth} ${setSize.imgHeight}`,
            }"
          >
            <image
              v-if="blockBackImgBase"
              :src="`data:image/png;base64,${blockBackImgBase}`"
              class="verify-img"
              mode="scaleToFill"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { reqCheck, reqGet } from '../api/index'
import { aesEncrypt } from '../utils/ase'

interface Props {
  captchaType?: string
  type?: string
  mode?: string
  verticalSpace?: number
  explain?: string
  imgSize?: { width: string, height: string }
  blockSize?: { width: string, height: string }
  barSize?: { width: string, height: string }
  defaultImg?: string
}

const props = withDefaults(defineProps<Props>(), {
  captchaType: 'blockPuzzle',
  type: '1',
  mode: 'fixed',
  verticalSpace: 5,
  explain: '向右滑动完成验证',
  imgSize: () => ({ width: '310px', height: '155px' }),
  blockSize: () => ({ width: '50px', height: '50px' }),
  barSize: () => ({ width: '310px', height: '40px' }),
  defaultImg: '',
})

const emit = defineEmits<{
  (e: 'success', params: { captchaVerification: string }): void
  (e: 'error', instance: any): void
  (e: 'ready', instance: any): void
}>()

// 状态
const secretKey = ref('')
const passFlag = ref(false)
const backImgBase = ref('')
const blockBackImgBase = ref('')
const backToken = ref('')
const startMoveTime = ref(0)
const endMovetime = ref(0)
const tipWords = ref('')
const text = ref(props.explain)
const finishText = ref('')

const setSize = reactive({
  imgHeight: props.imgSize.height,
  imgWidth: props.imgSize.width,
  barHeight: props.barSize.height,
  barWidth: props.barSize.width,
})

const moveBlockLeft = ref<string | undefined>(undefined)
const leftBarWidth = ref<string | undefined>(undefined)
const moveBlockBackgroundColor = ref<string | undefined>(undefined)
const leftBarBorderColor = ref('#ddd')
const iconColor = ref<string | undefined>(undefined)
const iconClass = ref('→')

const status = ref(false)
const isEnd = ref(false)
const showRefresh = ref(true)
const transitionLeft = ref('')
const transitionWidth = ref('')

// 拖动起始触摸 X 坐标（已减去当时滑块已有的偏移量）
const dragStartX = ref(0)

// 初始化
function init() {
  text.value = props.explain
  getPictrue()
  emit('ready', {})

  passFlag.value = false
  isEnd.value = false
  showRefresh.value = true
  moveBlockLeft.value = undefined
  leftBarWidth.value = undefined
  moveBlockBackgroundColor.value = '#fff'
  leftBarBorderColor.value = '#ddd'
  iconColor.value = '#000'
  iconClass.value = '→'
}

// 从事件中获取 X 坐标
function getEventX(e: any): number {
  if (e.touches && e.touches.length > 0)
    return Math.ceil(e.touches[0].clientX)
  if (e.clientX !== undefined)
    return Math.ceil(e.clientX)
  return 0
}

// 触摸/鼠标开始
function start(e: any) {
  if (isEnd.value)
    return

  startMoveTime.value = Date.now()
  status.value = true
  text.value = ''
  moveBlockBackgroundColor.value = '#337ab7'
  leftBarBorderColor.value = '#337AB7'
  iconColor.value = '#fff'

  // 当前滑块已有的 left 偏移
  const currentLeft = Number.parseInt((moveBlockLeft.value || '').replace('px', '') || '0')
  // 记录：触摸起始 X - 已有偏移 = dragStartX
  // 这样 move 时：offset = currentX - dragStartX = 新的 left 值
  dragStartX.value = getEventX(e) - currentLeft
}

// 触摸/鼠标移动
function move(e: any) {
  if (!status.value || isEnd.value)
    return

  const x = getEventX(e)
  if (x === 0)
    return

  // 直接算出新的偏移量（同步，无 DOM 查询）
  let offset = x - dragStartX.value

  // 边界控制
  const imgWidth = Number.parseInt(setSize.imgWidth)
  const blockWidth = Number.parseInt(props.blockSize.width)

  if (props.type !== '1') {
    const maxLeft = imgWidth - blockWidth
    if (offset > maxLeft)
      offset = maxLeft
  }

  if (offset < 0)
    offset = 0

  moveBlockLeft.value = `${offset}px`
  leftBarWidth.value = `${offset}px`
}

// 触摸/鼠标结束
function end() {
  if (!status.value || isEnd.value)
    return

  endMovetime.value = Date.now()
  status.value = false

  let moveLeftDistance = Number.parseInt((moveBlockLeft.value || '').replace('px', '') || '0')
  moveLeftDistance = moveLeftDistance * 310 / Number.parseInt(setSize.imgWidth)

  const pointJson = { x: moveLeftDistance, y: 5.0 }

  const data = {
    captchaType: props.captchaType,
    pointJson: secretKey.value
      ? aesEncrypt(JSON.stringify(pointJson), secretKey.value)
      : JSON.stringify(pointJson),
    token: backToken.value,
  }

  reqCheck(data).then((res) => {
    if (res.success) {
      moveBlockBackgroundColor.value = '#5cb85c'
      leftBarBorderColor.value = '#5cb85c'
      iconColor.value = '#fff'
      iconClass.value = '✓'
      showRefresh.value = false
      isEnd.value = true
      passFlag.value = true
      tipWords.value = `${((endMovetime.value - startMoveTime.value) / 1000).toFixed(2)}s验证成功`

      const captchaVerification = res.captchaVerification
        || (secretKey.value
          ? aesEncrypt(`${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5.0 })}`, secretKey.value)
          : `${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5.0 })}`)

      setTimeout(() => {
        tipWords.value = ''
        emit('success', { captchaVerification })
      }, 1000)
    }
    else {
      moveBlockBackgroundColor.value = '#d9534f'
      leftBarBorderColor.value = '#d9534f'
      iconColor.value = '#fff'
      iconClass.value = '✕'
      passFlag.value = false
      emit('error', {})
      tipWords.value = '验证失败'
      setTimeout(() => {
        refresh()
      }, 1000)
    }
  }).catch(() => {
    moveBlockBackgroundColor.value = '#d9534f'
    leftBarBorderColor.value = '#d9534f'
    iconColor.value = '#fff'
    iconClass.value = '✕'
    passFlag.value = false
    emit('error', {})
    tipWords.value = '验证失败'
    setTimeout(() => {
      refresh()
    }, 1000)
  })
}

// 刷新
function refresh() {
  showRefresh.value = true
  finishText.value = ''
  transitionLeft.value = 'left .3s'
  moveBlockLeft.value = '0'
  leftBarWidth.value = undefined
  transitionWidth.value = 'width .3s'
  leftBarBorderColor.value = '#ddd'
  moveBlockBackgroundColor.value = '#fff'
  iconColor.value = '#000'
  iconClass.value = '→'
  isEnd.value = false
  passFlag.value = false
  tipWords.value = ''

  getPictrue()
  setTimeout(() => {
    transitionWidth.value = ''
    transitionLeft.value = ''
    text.value = props.explain
  }, 300)
}

// 获取验证码图片
function getPictrue() {
  const data = {
    captchaType: props.captchaType,
    clientUid: uni.getStorageSync('slider') || null,
    ts: Date.now(),
  }

  reqGet(data).then((res) => {
    backImgBase.value = res.originalImageBase64
    blockBackImgBase.value = res.jigsawImageBase64 || ''
    backToken.value = res.token
    secretKey.value = res.secretKey
  }).catch((err) => {
    tipWords.value = err.message || '获取验证码失败'
    console.error('[VerifySlide] Get captcha failed:', err)
  })
}

onMounted(() => {
  init()

  // H5 端：需要在 window 上监听 move/end，因为鼠标可能移出滑块元素
  // #ifdef H5
  window.addEventListener('touchmove', move)
  window.addEventListener('mousemove', move)
  window.addEventListener('touchend', end)
  window.addEventListener('mouseup', end)
  // #endif
})

onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener('touchmove', move)
  window.removeEventListener('mousemove', move)
  window.removeEventListener('touchend', end)
  window.removeEventListener('mouseup', end)
  // #endif
})

defineExpose({
  refresh,
})
</script>

<style lang="scss" scoped>
.verify-slide {
  position: relative;
  user-select: none;
}

.verify-img-out {
  position: relative;
}

.verify-img-panel {
  position: relative;
  overflow: hidden;
  border-radius: 8rpx;

  .verify-img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.verify-refresh {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  z-index: 2;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  cursor: pointer;

  .icon-refresh {
    font-size: 28rpx;
    color: #fff;
  }
}

.verify-tips {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx;
  text-align: center;
  font-size: 24rpx;
  color: #fff;
  animation: tips 0.3s;
}

.suc-bg {
  background: rgba(92, 184, 92, 0.9);
}

.err-bg {
  background: rgba(217, 83, 79, 0.9);
}

@keyframes tips {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.verify-bar-area {
  position: relative;
  display: flex;
  align-items: center;
  background: #f7f9fa;
  border-radius: 8rpx;
  overflow: visible; // 允许滑块小图片向上显示
}

.verify-msg {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 28rpx;
  color: #333;
  z-index: 1;
}

.verify-left-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  background: #e1e8ed;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  overflow: visible; // 允许滑块小图片向上显示
}

.verify-move-block {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 2;
  overflow: visible; // 允许滑块小图片向上显示

  .verify-icon {
    font-size: 32rpx;
  }
}

.verify-sub-block {
  position: absolute;
  left: 0;
  overflow: hidden;
  z-index: 3;

  .verify-img {
    width: 100%;
    height: 100%;
    display: block;
  }
}
</style>
