<template>
  <view class="verify-points">
    <view class="verify-img-out">
      <view
        class="verify-img-panel"
        :style="{
          width: setSize.imgWidth,
          height: setSize.imgHeight,
          marginBottom: `${verticalSpace}px`,
        }"
      >
        <view v-show="showRefresh" class="verify-refresh" @tap="refresh">
          <text class="icon-refresh">⟳</text>
        </view>
        <image
          v-if="pointBackImgBase"
          :src="`data:image/png;base64,${pointBackImgBase}`"
          class="verify-img"
          mode="aspectFill"
          @tap="canvasClick"
        />

        <!-- 已点击的点 -->
        <view
          v-for="(tempPoint, index) in tempPoints"
          :key="index"
          class="point-area"
          :style="{
            top: `${parseInt(tempPoint.y - 10)}px`,
            left: `${parseInt(tempPoint.x - 10)}px`,
          }"
        >
          {{ index + 1 }}
        </view>
      </view>
    </view>

    <!-- 提示区域 -->
    <view
      class="verify-bar-area"
      :style="{
        width: setSize.imgWidth,
        color: barAreaColor,
        borderColor: barAreaBorderColor,
        lineHeight: barSize.height,
      }"
    >
      <text class="verify-msg">{{ text }}</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { reqCheck, reqGet } from '../api/index'
import { aesEncrypt } from '../utils/ase'

interface Props {
  captchaType?: string
  mode?: string
  verticalSpace?: number
  imgSize?: { width: string, height: string }
  barSize?: { width: string, height: string }
}

const props = withDefaults(defineProps<Props>(), {
  captchaType: 'clickWord',
  mode: 'fixed',
  verticalSpace: 5,
  imgSize: () => ({ width: '310px', height: '155px' }),
  barSize: () => ({ width: '310px', height: '40px' }),
})

const emit = defineEmits<{
  (e: 'success', params: { captchaVerification: string }): void
  (e: 'error', instance: any): void
  (e: 'ready', instance: any): void
}>()

// 状态
const secretKey = ref('')
const checkNum = 3
const pointBackImgBase = ref('')
const poinTextList = ref<string[]>([])
const backToken = ref('')

const setSize = reactive({
  imgHeight: props.imgSize.height,
  imgWidth: props.imgSize.width,
  barHeight: props.barSize.height,
  barWidth: props.barSize.width,
})

const tempPoints = ref<{ x: number, y: number }[]>([])
const checkPosArr = ref<{ x: number, y: number }[]>([])
const text = ref('')
const barAreaColor = ref('#000')
const barAreaBorderColor = ref('#ddd')
const showRefresh = ref(true)
const bindingClick = ref(true)
const num = ref(1)

// 初始化
function init() {
  tempPoints.value = []
  checkPosArr.value = []
  num.value = 1
  bindingClick.value = true
  barAreaColor.value = '#000'
  barAreaBorderColor.value = '#ddd'
  getPictrue()
  emit('ready', {})
}

// 点击图片
function canvasClick(e: any) {
  if (!bindingClick.value)
    return

  const touch = e.detail || e
  const x = touch.x || touch.offsetX || 0
  const y = touch.y || touch.offsetY || 0

  checkPosArr.value.push({ x, y })

  if (num.value < checkNum) {
    tempPoints.value.push({ x, y })
    num.value++
  }
  else if (num.value === checkNum) {
    tempPoints.value.push({ x, y })

    // 按比例转换坐标
    const checkPos = checkPosArr.value.map(p => ({
      x: Math.round(310 * p.x / Number.parseInt(setSize.imgWidth)),
      y: Math.round(155 * p.y / Number.parseInt(setSize.imgHeight)),
    }))

    const captchaVerification = secretKey.value
      ? aesEncrypt(`${backToken.value}---${JSON.stringify(checkPos)}`, secretKey.value)
      : `${backToken.value}---${JSON.stringify(checkPos)}`

    const data = {
      captchaType: props.captchaType,
      pointJson: secretKey.value
        ? aesEncrypt(JSON.stringify(checkPos), secretKey.value)
        : JSON.stringify(checkPos),
      token: backToken.value,
    }

    reqCheck(data).then((res) => {
      if (res.repCode === '0000') {
        barAreaColor.value = '#4cae4c'
        barAreaBorderColor.value = '#5cb85c'
        text.value = '验证成功'
        bindingClick.value = false
        emit('success', { captchaVerification })
      }
      else {
        emit('error', {})
        barAreaColor.value = '#d9534f'
        barAreaBorderColor.value = '#d9534f'
        text.value = '验证失败'
        setTimeout(() => {
          refresh()
        }, 700)
      }
    }).catch(() => {
      emit('error', {})
      barAreaColor.value = '#d9534f'
      barAreaBorderColor.value = '#d9534f'
      text.value = '验证失败'
      setTimeout(() => {
        refresh()
      }, 700)
    })
  }
}

// 刷新
function refresh() {
  tempPoints.value = []
  checkPosArr.value = []
  num.value = 1
  bindingClick.value = true
  barAreaColor.value = '#000'
  barAreaBorderColor.value = '#ddd'
  showRefresh.value = true
  getPictrue()
}

// 获取验证码图片
function getPictrue() {
  const data = {
    captchaType: props.captchaType,
    clientUid: uni.getStorageSync('point') || null,
    ts: Date.now(),
  }

  reqGet(data).then((res) => {
    // reqGet 已返回规范化数据格式
    pointBackImgBase.value = res.originalImageBase64
    backToken.value = res.token
    secretKey.value = res.secretKey
    // 点选验证的文字列表（如果后端返回）
    poinTextList.value = (res as any).wordList || []
    if (poinTextList.value.length > 0) {
      text.value = `请依次点击【${poinTextList.value.join(',')}】`
    }
    else {
      text.value = '请依次点击图中文字'
    }
  }).catch((err) => {
    text.value = err.message || '获取验证码失败'
  })
}

onMounted(() => {
  init()
})

defineExpose({
  refresh,
})
</script>

<style lang="scss" scoped>
.verify-points {
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

.point-area {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  background-color: #1abd6c;
  color: #fff;
  z-index: 9999;
  text-align: center;
  line-height: 40rpx;
  border-radius: 50%;
  font-size: 24rpx;
}

.verify-bar-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
}

.verify-msg {
  font-size: 28rpx;
  color: #333;
}
</style>
