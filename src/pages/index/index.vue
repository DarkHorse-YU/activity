<script lang="ts" setup>
defineOptions({
  name: 'Home',
})
definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
})

// 背景图片
const bgImageUrl = 'http://124.221.55.156:9000/xiaoyu/activity/design2.png'

// 补贴额度数据
interface SubsidyInfo {
  totalAmount: number
  remainingAmount: number
  releaseDate: string
  releaseNote: string
}

const subsidyInfo = ref<SubsidyInfo>({
  totalAmount: 10000000,
  remainingAmount: 9175000,
  releaseDate: '2月3日',
  releaseNote: '系统释放补贴额度，额度用完则暂停申报',
})

const loading = ref(true)

// 计算进度百分比
const progressPercent = computed(() => {
  if (subsidyInfo.value.totalAmount === 0)
    return 0
  return Math.round((subsidyInfo.value.remainingAmount / subsidyInfo.value.totalAmount) * 100)
})

// 获取补贴额度信息
async function fetchSubsidyInfo() {
  try {
    loading.value = true
    // TODO: 替换为实际的接口地址
    // const res = await http.get<SubsidyInfo>('/api/subsidy/info')
    // subsidyInfo.value = res.data

    // 模拟接口调用
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  catch (error) {
    console.error('获取补贴信息失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 按钮点击事件 - 登录检查由全局路由拦截器统一处理
// 白名单配置见 src/router/config.ts 的 EXCLUDE_LOGIN_PATH_LIST
function handleCarParticipate() {
  uni.navigateTo({ url: '/pages/activity/car-participate' })
}

function handleSubsidyApply() {
  uni.navigateTo({ url: '/pages/activity/subsidy-apply' })
}

function handleMyApplication() {
  uni.navigateTo({ url: '/pages/activity/my-application' })
}

function handleActivityRules() {
  uni.navigateTo({ url: '/pages/activity/rules' })
}

// 页面加载时获取数据
onLoad(() => {
  fetchSubsidyInfo()
})
</script>

<template>
  <!-- 主容器：使用背景图片，等比例适配 -->
  <view class="activity-container">
    <!-- 背景图片层 -->
    <image class="bg-image" :src="bgImageUrl" mode="aspectFill" />

    <!-- 内容层 - 使用 flex 布局实现响应式 -->
    <view class="content-layer">
      <!-- 顶部留空 - 展示背景图的标题和汽车 -->
      <view class="top-spacer" />

      <!-- 补贴额度横幅 -->
      <view class="quota-banner">
        <view class="quota-header">
          <view class="quota-title">
            补贴金额:
          </view>
          <view class="quota-badge">
            抢
          </view>
        </view>
        <view class="quota-progress-wrapper">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: `${progressPercent}%` }" />
          </view>
          <view class="quota-text">
            剩余额度: {{ subsidyInfo.remainingAmount.toLocaleString() }}/{{ subsidyInfo.totalAmount.toLocaleString() }}
          </view>
        </view>
        <view class="quota-footer">
          {{ subsidyInfo.releaseDate }}起，{{ subsidyInfo.releaseNote }}
        </view>
      </view>

      <!-- 底部按钮区域 -->
      <view class="button-section">
        <!-- 上方两个大按钮 -->
        <view class="button-row-large">
          <!-- 左侧：参与车企 - 蓝色 -->
          <view class="button-large blue" @tap="handleCarParticipate">
            <view class="button-main-text">
              参与企业
            </view>
            <view class="button-sub-text">
              立即查看
            </view>
          </view>
          <!-- 右侧：补贴申报 - 橙红色渐变 -->
          <view class="button-large orange" @tap="handleSubsidyApply">
            <view class="button-main-text">
              补贴申报
            </view>
            <view class="button-sub-text">
              立即申报
            </view>
          </view>
        </view>

        <!-- 下方两个小按钮 -->
        <view class="button-row-small">
          <view class="button-small" @tap="handleMyApplication">
            <view class="button-text">
              我的申报
            </view>
          </view>
          <view class="button-small" @tap="handleActivityRules">
            <view class="button-text">
              活动规则
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.activity-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.content-layer {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* 顶部留空区域 - 展示背景图的标题和汽车 */
.top-spacer {
  flex: 1;
  min-height: 200rpx;
}

/* 补贴额度横幅 */
.quota-banner {
  margin: 0 40rpx 60rpx;
  background: #fdf6ec;
  border-radius: 20rpx;
  padding: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.quota-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.quota-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333333;
}

.quota-badge {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  font-size: 20rpx;
  font-weight: bold;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.quota-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fb923c 0%, #ef4444 100%);
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.quota-text {
  font-size: 24rpx;
  font-weight: 500;
  color: #333333;
  white-space: nowrap;
}

.quota-footer {
  font-size: 24rpx;
  color: #ef4444;
  line-height: 1.5;
}

/* 底部按钮区域 */
.button-section {
  padding: 0 40rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

/* 大按钮行 */
.button-row-large {
  display: flex;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.button-large {
  flex: 1;
  height: 140rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &:active {
    transform: scale(0.96);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }

  /* 蓝色按钮 - 参与企业 */
  &.blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);

    .button-main-text {
      font-size: 42rpx;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 8rpx;
      text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
    }

    .button-sub-text {
      background: rgba(255, 255, 255, 0.95);
      color: #2563eb;
      font-size: 24rpx;
      padding: 6rpx 20rpx;
      border-radius: 16rpx;
      font-weight: 500;
    }
  }

  /* 橙红色渐变按钮 - 补贴申报 */
  &.orange {
    background: linear-gradient(135deg, #fb923c 0%, #ef4444 100%);

    .button-main-text {
      font-size: 42rpx;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 8rpx;
      text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
    }

    .button-sub-text {
      background: rgba(255, 255, 255, 0.95);
      color: #ef4444;
      font-size: 24rpx;
      padding: 6rpx 20rpx;
      border-radius: 16rpx;
      font-weight: 500;
    }
  }
}

/* 小按钮行 */
.button-row-small {
  display: flex;
  gap: 18rpx;
}

.button-small {
  flex: 1;
  height: 76rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;

  &:active {
    transform: scale(0.96);
    box-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.08);
  }

  .button-text {
    font-size: 24rpx;
    font-weight: 500;
    color: #ffffff;
    text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
  }

  /* 我的申报 - 米白色 */
  &:first-child {
    background: #fdf6ec;

    .button-text {
      color: #78350f;
      text-shadow: none;
    }
  }

  /* 活动规则 - 米白色 */
  &:last-child {
    background: #fdf6ec;

    .button-text {
      color: #78350f;
      text-shadow: none;
    }
  }
}
</style>
