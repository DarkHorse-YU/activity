<script lang="ts" setup>
import type { ICouponVerificationRuleItem } from '@/api/types/coupon-verification'
import { getCouponVerificationRules } from '@/api/coupon-verification'

defineOptions({
  name: 'CouponVerificationRules',
})

definePage({
  style: {
    navigationBarTitleText: '规则说明',
  },
})

const loading = ref(true)
const rules = ref<ICouponVerificationRuleItem[]>([])

const fallbackRules: ICouponVerificationRuleItem[] = [
  { id: 1, title: '核销说明', content: '商家核销前需确认用户券码有效，核销成功后记录自动生成。' },
  { id: 2, title: '凭证上传', content: '如活动要求上传凭证，请在核销成功后及时补传，逾期可能影响审核结果。' },
  { id: 3, title: '审核结果', content: '待审核、已驳回、已通过等状态均可在核销记录中查看，驳回后可重新提交。' },
  { id: 4, title: '异常处理', content: '如遇重复核销、券码失效或活动限制，请联系活动运营方处理。' },
]

async function fetchRules() {
  try {
    loading.value = true
    const res = await getCouponVerificationRules<{ list?: ICouponVerificationRuleItem[] }>()
    const remoteRules = res.list || []
    rules.value = remoteRules.length > 0 ? remoteRules : fallbackRules
  }
  catch (error) {
    console.error('获取核销规则失败:', error)
    rules.value = fallbackRules
  }
  finally {
    loading.value = false
  }
}

onLoad(() => {
  fetchRules()
})
</script>

<template>
  <view class="page-container">
    <view class="header-card">
      <view class="header-title">
        规则说明
      </view>
      <view class="header-desc">
        核销前请先确认活动要求、凭证规范和审核流程，避免后续因资料不完整被驳回。
      </view>
    </view>

    <view v-if="loading" class="loading-container">
      <wd-loading />
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else class="rule-list">
      <view v-for="(item, index) in rules" :key="item.id" class="rule-item">
        <view class="rule-index">
          {{ index + 1 }}
        </view>
        <view class="rule-main">
          <view class="rule-title">
            {{ item.title }}
          </view>
          <view class="rule-content">
            {{ item.content }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background: linear-gradient(180deg, #f4fbf6 0%, #ffffff 38%, #ffffff 100%);
}

.header-card {
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  box-shadow: 0 10rpx 28rpx rgba(22, 163, 74, 0.12);
}

.header-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #166534;
}

.header-desc {
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #166534;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #64748b;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 24rpx;
}

.rule-item {
  display: flex;
  gap: 18rpx;
  padding: 26rpx 24rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
}

.rule-index {
  width: 46rpx;
  height: 46rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rule-main {
  flex: 1;
}

.rule-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.rule-content {
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.8;
  color: #475569;
}
</style>
