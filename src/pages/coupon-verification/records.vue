<script lang="ts" setup>
import type { ICouponVerificationRecordItem } from '@/api/types/coupon-verification'
import { getCouponVerificationRecords } from '@/api/coupon-verification'

defineOptions({
  name: 'CouponVerificationRecords',
})

definePage({
  style: {
    navigationBarTitleText: '核销记录',
  },
})

const loading = ref(true)
const records = ref<ICouponVerificationRecordItem[]>([])

const statusMap: Record<string, { text: string, color: string, bg: string }> = {
  PENDING_VOUCHER: { text: '待上传凭证', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  PENDING_REVIEW: { text: '待审核', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  REJECTED: { text: '已驳回', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  APPROVED: { text: '已通过', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
}

function getStatusMeta(status: string) {
  return statusMap[status] || { text: status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }
}

function viewRecord(item: ICouponVerificationRecordItem) {
  const mode = item.currentStatus === 'PENDING_VOUCHER' ? 'create' : 'detail'
  uni.navigateTo({ url: `/pages/coupon-verification/detail?id=${item.id}&mode=${mode}` })
}

async function fetchRecords() {
  try {
    loading.value = true
    const res = await getCouponVerificationRecords<{ list?: ICouponVerificationRecordItem[] }>({
      page: 1,
      size: 100,
    })
    records.value = res.list || []
  }
  catch (error) {
    console.error('获取核销记录失败:', error)
    uni.showToast({ title: '获取记录失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onShow(() => {
  fetchRecords()
})
</script>

<template>
  <view class="page-container">
    <view v-if="loading" class="loading-container">
      <wd-loading />
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else class="content">
      <view class="page-header">
        <text class="page-title">核销记录</text>
        <text class="page-subtitle">共 {{ records.length }} 条记录</text>
      </view>

      <view v-if="records.length > 0" class="record-list">
        <view v-for="item in records" :key="item.id" class="record-card" @tap="viewRecord(item)">
          <view class="record-top">
            <view class="record-main">
              <view class="record-title">
                {{ item.couponTitle || '优惠券核销' }}
              </view>
              <view class="record-no">
                核销单号：{{ item.verificationNo }}
              </view>
            </view>

            <view
              class="status-tag"
              :style="{ color: getStatusMeta(item.currentStatus).color, background: getStatusMeta(item.currentStatus).bg }"
            >
              {{ getStatusMeta(item.currentStatus).text }}
            </view>
          </view>

          <view class="record-info">
            <view class="info-item">
              <text class="info-label">券码</text>
              <text class="info-value">{{ item.couponCode }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">商家</text>
              <text class="info-value">{{ item.merchantName || '--' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">核销时间</text>
              <text class="info-value">{{ item.verifiedAt || '--' }}</text>
            </view>
          </view>

          <view class="record-footer">
            <text class="footer-text">
              {{ item.currentStatus === 'PENDING_VOUCHER' ? '去上传凭证' : '查看详情' }}
            </text>
            <text class="footer-arrow">></text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-title">
          暂无核销记录
        </view>
        <view class="empty-desc">
          完成扫码核销或输入核销码后，记录会显示在这里。
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6fbf7 0%, #ffffff 42%, #ffffff 100%);
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-container {
  padding-top: 220rpx;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #64748b;
}

.content {
  padding: 32rpx 28rpx 48rpx;
}

.page-header {
  margin-bottom: 24rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64748b;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-card {
  padding: 28rpx 24rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.06);
}

.record-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.record-main {
  min-width: 0;
  flex: 1;
}

.record-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.record-no {
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #64748b;
}

.status-tag {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.record-info {
  margin-top: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  font-size: 24rpx;

  &:not(:first-child) {
    margin-top: 14rpx;
  }
}

.info-label {
  color: #94a3b8;
}

.info-value {
  color: #334155;
  text-align: right;
}

.record-footer {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  color: #16a34a;
  font-size: 24rpx;
  font-weight: 600;
}

.footer-arrow {
  font-size: 30rpx;
}

.empty-state {
  margin-top: 180rpx;
  padding: 0 40rpx;
  text-align: center;
}

.empty-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}

.empty-desc {
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #64748b;
}
</style>
