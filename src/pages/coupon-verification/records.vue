<script lang="ts" setup>
import type { ICouponWriteOffRecordItem } from '@/api/types/coupon-verification'
import { getWriteOffList } from '@/api/coupon-verification'

defineOptions({
  name: 'CouponVerificationRecords',
})

definePage({
  style: {
    navigationBarTitleText: '核销记录',
    enablePullDownRefresh: true,
  },
})

const loading = ref(true)
const records = ref<ICouponWriteOffRecordItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const statusMap: Record<string, { text: string, color: string, bg: string }> = {
  PENDING_UPLOAD: { text: '待上传凭证', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  PENDING_AUDIT: { text: '待审核', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  REJECTED: { text: '已驳回', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  APPROVED: { text: '已通过', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
  CANCELLED: { text: '已撤销', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
}

const pendingVoucherCount = computed(() => records.value.filter(item => item.auditStatus === 'PENDING_UPLOAD').length)
const pendingReviewCount = computed(() => records.value.filter(item => item.auditStatus === 'PENDING_AUDIT').length)
const rejectedCount = computed(() => records.value.filter(item => item.auditStatus === 'REJECTED').length)

function getStatusMeta(status: string) {
  return statusMap[status] || { text: status || '--', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }
}

function formatTime(value?: string | null) {
  if (!value) {
    return '--'
  }

  const normalized = value.replace('T', ' ')
  return normalized.length > 16 ? normalized.slice(0, 16) : normalized
}

function viewRecord(item: ICouponWriteOffRecordItem) {
  if (item.auditStatus === 'PENDING_UPLOAD') {
    // 待上传凭证，跳转到凭证上传页面
    uni.navigateTo({ url: `/pages/coupon-verification/voucher?recordId=${item.id}&templateId=${item.templateId}` })
  }
  else {
    // 其他状态，跳转到详情页面
    uni.navigateTo({ url: `/pages/coupon-verification/detail?id=${item.id}` })
  }
}

async function fetchRecords(showRefreshToast = false) {
  try {
    loading.value = true
    const res = await getWriteOffList({
      page: page.value,
      size: size.value,
    })
    records.value = res.list || []
    total.value = res.total || 0

    if (showRefreshToast) {
      uni.showToast({ title: '已刷新', icon: 'success' })
    }
  }
  catch (error) {
    console.error('获取核销记录失败:', error)
    uni.showToast({ title: '获取记录失败', icon: 'none' })
  }
  finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

onShow(() => {
  fetchRecords()
})

onPullDownRefresh(() => {
  fetchRecords(true)
})
</script>

<template>
  <view class="page-container">
    <view class="page-glow page-glow--top" />
    <view class="page-glow page-glow--bottom" />

    <view v-if="loading" class="loading-container">
      <wd-loading size="40px" />
      <text class="loading-text">记录加载中...</text>
    </view>

    <view v-else class="content">
      <view class="hero-panel">
        <view class="hero-head">
          <view class="hero-badge">
            Verification Ledger
          </view>
          <view class="hero-status">
            共 {{ total }} 条
          </view>
        </view>

        <view class="hero-title">
          核销记录
        </view>
        <view class="hero-desc">
          汇总查看门店核销进度，待补传、待审核与驳回状态都能快速追踪。
        </view>
      </view>

      <view class="stats-grid">
        <view class="stat-card">
          <view class="stat-card__label">
            全部
          </view>
          <view class="stat-card__value">
            {{ total }}
          </view>
        </view>

        <view class="stat-card stat-card--accent">
          <view class="stat-card__label">
            待上传凭证
          </view>
          <view class="stat-card__value">
            {{ pendingVoucherCount }}
          </view>
        </view>

        <view class="stat-card">
          <view class="stat-card__label">
            待审核
          </view>
          <view class="stat-card__value">
            {{ pendingReviewCount }}
          </view>
        </view>

        <view class="stat-card">
          <view class="stat-card__label">
            已驳回
          </view>
          <view class="stat-card__value">
            {{ rejectedCount }}
          </view>
        </view>
      </view>

      <view v-if="records.length > 0" class="record-list">
        <view v-for="item in records" :key="item.id" class="record-card" @tap="viewRecord(item)">
          <view class="record-card__head">
            <view class="record-card__main">
              <view class="record-card__title">
                {{ item.templateName || '优惠券核销' }}
              </view>
              <view class="record-card__no">
                券码：{{ item.couponNo || '--' }}
              </view>
            </view>

            <view
              class="status-tag"
              :style="{ color: getStatusMeta(item.auditStatus).color, background: getStatusMeta(item.auditStatus).bg }"
            >
              {{ getStatusMeta(item.auditStatus).text }}
            </view>
          </view>

          <view class="record-card__meta">
            <view class="meta-item">
              <text class="meta-item__label">活动</text>
              <text class="meta-item__value">{{ item.activityName || '--' }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-item__label">核销方式</text>
              <text class="meta-item__value">{{ item.writeOffMode === 'QR_SCAN' ? '扫码' : '输码' }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-item__label">核销时间</text>
              <text class="meta-item__value">{{ formatTime(item.writeOffTime) }}</text>
            </view>
          </view>

          <view class="record-card__footer">
            <text class="record-card__hint">
              {{ item.auditStatus === 'PENDING_UPLOAD' ? '去上传凭证' : '查看详情' }}
            </text>
            <text class="record-card__arrow">></text>
          </view>
        </view>
      </view>

      <view v-else class="empty-card">
        <view class="empty-card__title">
          暂无核销记录
        </view>
        <view class="empty-card__desc">
          完成扫码核销或输入核销码后，记录会自动同步到这里，下拉可刷新。
        </view>
      </view>
    </view>
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
  bottom: 200rpx;
  width: 340rpx;
  height: 340rpx;
  background: radial-gradient(circle, rgba(24, 91, 78, 0.18) 0%, rgba(24, 91, 78, 0) 72%);
}

.loading-container,
.content {
  position: relative;
  z-index: 1;
}

.loading-container {
  min-height: calc(100vh - 140rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #64748b;
}

.hero-panel {
  padding: 14rpx 2rpx 0;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.hero-badge,
.hero-status {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.hero-badge {
  letter-spacing: 1rpx;
  background: rgba(24, 91, 78, 0.1);
  color: #185b4e;
  border: 1rpx solid rgba(24, 91, 78, 0.14);
}

.hero-status {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 28rpx;
}

.stat-card {
  padding: 22rpx 20rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(48, 38, 24, 0.06);
}

.stat-card--accent {
  background: linear-gradient(180deg, rgba(255, 248, 234, 0.98), rgba(255, 255, 255, 0.92));
}

.stat-card__label {
  font-size: 22rpx;
  color: #7b7267;
}

.stat-card__value {
  margin-top: 16rpx;
  font-size: 42rpx;
  font-weight: 800;
  color: #1d1a16;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 22rpx;
}

.record-card {
  padding: 28rpx 24rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 14rpx 32rpx rgba(48, 38, 24, 0.07);
}

.record-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.record-card__main {
  min-width: 0;
  flex: 1;
}

.record-card__title {
  font-size: 31rpx;
  font-weight: 800;
  color: #1d1a16;
}

.record-card__no {
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #7a7267;
}

.status-tag {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.record-card__meta {
  margin-top: 22rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: #f8f6f1;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  font-size: 24rpx;

  &:not(:first-child) {
    margin-top: 14rpx;
  }
}

.meta-item__label {
  color: #978d80;
}

.meta-item__value {
  color: #3f392f;
  text-align: right;
}

.record-card__footer {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}

.record-card__hint,
.record-card__arrow {
  color: #185b4e;
  font-weight: 700;
}

.record-card__hint {
  font-size: 24rpx;
}

.record-card__arrow {
  font-size: 30rpx;
}

.empty-card {
  margin-top: 36rpx;
  padding: 54rpx 40rpx;
  border-radius: 30rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 14rpx 30rpx rgba(48, 38, 24, 0.06);
}

.empty-card__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1d1a16;
}

.empty-card__desc {
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #6f665b;
}

@media (max-width: 680rpx) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
