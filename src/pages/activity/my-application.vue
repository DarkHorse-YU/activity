<script lang="ts" setup>
import { http } from '@/http/http'

defineOptions({
  name: 'MyApplication',
})
definePage({
  style: {
    navigationBarTitleText: '我的申报',
  },
})

// 申请记录类型
interface ApplicationItem {
  id: number
  applicationNo: string
  activityId: number
  activityName: string
  currentStatus: 'DRAFT' | 'PENDING' | 'REJECTED' | 'APPROVED'
  rejectCount: number
  approvedAt: string | null
  carType: string
}

// 状态映射
const statusMap: Record<string, { text: string, color: string }> = {
  DRAFT: { text: '草稿', color: '#999999' },
  PENDING: { text: '审核中', color: '#F99C5F' },
  REJECTED: { text: '已驳回', color: '#ff4d4f' },
  APPROVED: { text: '已通过', color: '#52c41a' },
}

// 获取状态显示信息
function getStatusInfo(status: string) {
  return statusMap[status] || { text: status, color: '#999999' }
}

// 获取购车类型颜色
function getCarTypeColor(carType: string) {
  if (!carType)
    return { color: '#999999', bg: 'rgba(153, 153, 153, 0.1)' }
  if (carType.includes('新能源'))
    return { color: '#52c41a', bg: 'rgba(82, 196, 26, 0.1)' }
  return { color: '#1890ff', bg: 'rgba(24, 144, 255, 0.1)' }
}

// 状态
const loading = ref(true)
const applications = ref<ApplicationItem[]>([])

// 获取申请列表
async function fetchApplications() {
  try {
    loading.value = true
    const res = await http.get<{ list: ApplicationItem[] }>('/activity/subsidy/user/application', {
      page: 1,
      size: 100,
    })
    applications.value = res.list || []
  }
  catch (error) {
    console.error('获取申请列表失败:', error)
    uni.showToast({ title: '获取数据失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

// 查看详情
function viewDetail(id: number) {
  uni.navigateTo({ url: `/pages/activity/application-detail?id=${id}` })
}

// 页面显示时刷新数据（从详情页返回时也能刷新）
onShow(() => {
  fetchApplications()
})
</script>

<template>
  <view class="page-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="bg-circle bg-circle-1" />
      <view class="bg-circle bg-circle-2" />
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <wd-loading />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 申请列表 -->
    <view v-else class="application-list">
      <!-- 页面标题 -->
      <view class="page-header">
        <text class="page-title">我的申报</text>
        <text class="page-subtitle">共 {{ applications.length }} 条记录</text>
      </view>

      <view v-for="item in applications" :key="item.id" class="application-card" @tap="viewDetail(item.id)">
        <!-- 左侧装饰条 -->
        <view class="card-accent" :style="{ backgroundColor: getStatusInfo(item.currentStatus).color }" />

        <view class="card-content">
          <view class="card-header">
            <view class="car-info">
              <view class="application-no">
                {{ item.applicationNo }}
              </view>
              <view
                class="car-type-tag"
                :style="{
                  color: getCarTypeColor(item.carType).color,
                  backgroundColor: getCarTypeColor(item.carType).bg,
                }"
              >
                {{ item.carType || '未填写车型' }}
              </view>
            </view>
            <view class="status-badge" :style="{ backgroundColor: getStatusInfo(item.currentStatus).color }">
              {{ getStatusInfo(item.currentStatus).text }}
            </view>
          </view>

          <view class="card-divider" />

          <view class="card-footer">
            <view class="activity-info">
              <text class="activity-label">活动</text>
              <text class="activity-name">{{ item.activityName }}</text>
            </view>
            <view class="arrow-wrapper">
              <text class="arrow">›</text>
            </view>
          </view>

          <!-- 驳回次数提示 -->
          <view v-if="item.rejectCount > 0" class="reject-tip">
            <text class="reject-icon">!</text>
            <text>已驳回 {{ item.rejectCount }} 次</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="applications.length === 0" class="empty">
        <view class="empty-icon-wrapper">
          <view class="empty-icon">
            <view class="icon-line" />
            <view class="icon-line" />
            <view class="icon-line" />
          </view>
        </view>
        <text class="empty-title">暂无申报记录</text>
        <text class="empty-desc">您还没有提交过申报申请</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff7f0 0%, #fafafa 30%, #f5f5f5 100%);
  position: relative;
  overflow: hidden;
}

// 背景装饰圆
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
}

.bg-circle-1 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
  top: -100rpx;
  right: -50rpx;
  filter: blur(60rpx);
}

.bg-circle-2 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #fbb97d 0%, #fcd5b5 100%);
  top: 100rpx;
  left: -80rpx;
  filter: blur(50rpx);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  position: relative;
  z-index: 1;
}

.loading-text {
  margin-top: 20rpx;
  color: #999;
  font-size: 28rpx;
}

.application-list {
  padding: 32rpx;
  position: relative;
  z-index: 1;
}

// 页面标题
.page-header {
  margin-bottom: 32rpx;
  padding-left: 8rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8rpx;
}

.page-subtitle {
  font-size: 26rpx;
  color: #999999;
}

// 卡片样式
.application-card {
  background: #ffffff;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  display: flex;
  overflow: hidden;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow:
      0 1rpx 4rpx rgba(0, 0, 0, 0.04),
      0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  }
}

// 左侧装饰条
.card-accent {
  width: 8rpx;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  padding: 28rpx 24rpx;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;

  .application-no {
    font-size: 30rpx;
    font-weight: 600;
    color: #333333;
    margin-bottom: 12rpx;
  }

  .car-type-tag {
    display: inline-block;
    font-size: 22rpx;
    padding: 6rpx 14rpx;
    border-radius: 6rpx;
  }

  .status-badge {
    font-size: 22rpx;
    font-weight: 500;
    color: #ffffff;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    flex-shrink: 0;
    margin-left: 16rpx;
  }
}

.card-divider {
  height: 1rpx;
  background: #f0f0f0;
  margin-bottom: 16rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .activity-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .activity-label {
    font-size: 22rpx;
    color: #bbbbbb;
    margin-bottom: 4rpx;
  }

  .activity-name {
    font-size: 26rpx;
    color: #e8864a;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arrow-wrapper {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f8f8;
    border-radius: 50%;
    margin-left: 16rpx;
  }

  .arrow {
    font-size: 32rpx;
    color: #cccccc;
  }
}

.reject-tip {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #ff4d4f;
  background: linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%);
  padding: 10rpx 16rpx;
  border-radius: 8rpx;
  display: inline-flex;
  align-items: center;
  gap: 8rpx;

  .reject-icon {
    width: 28rpx;
    height: 28rpx;
    background: #ff4d4f;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    font-weight: bold;
  }
}

// 空状态
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.empty-icon-wrapper {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #fff7f0 0%, #ffedd5 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.empty-icon {
  width: 80rpx;
  height: 72rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12rpx 16rpx;
  background: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(249, 156, 95, 0.15);
}

.icon-line {
  height: 6rpx;
  background: #f99c5f;
  border-radius: 3rpx;

  &:nth-child(1) {
    width: 100%;
  }

  &:nth-child(2) {
    width: 70%;
  }

  &:nth-child(3) {
    width: 50%;
  }
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999999;
}
</style>
