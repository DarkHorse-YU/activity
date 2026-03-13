<script lang="ts" setup>
defineOptions({
  name: 'CouponActivityRules',
})

definePage({
  style: {
    navigationBarTitleText: '抢券活动规则',
  },
})

const rules = [
  '活动期间每个账号可参与领取，具体发券时间以活动首页公告为准。',
  '券码领取后请在有效期内使用，逾期失效且不支持补发。',
  '如发现异常领取、批量刷券等行为，平台有权取消资格。',
  '券码使用规则以商家核销说明为准，最终解释权归活动主办方所有。',
]
</script>

<template>
  <view class="page-container">
    <view class="header-card">
      <view class="header-title">
        抢券活动规则
      </view>
      <view class="header-desc">
        领取前请先阅读以下规则，避免领取后无法使用。
      </view>
    </view>

    <view class="rule-list">
      <view v-for="(rule, index) in rules" :key="rule" class="rule-item">
        <view class="rule-index">
          {{ index + 1 }}
        </view>
        <view class="rule-content">
          {{ rule }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 48rpx;
  background: linear-gradient(180deg, #fffdf8 0%, #fff7ed 42%, #ffffff 100%);
}

.header-card {
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  box-shadow: 0 10rpx 30rpx rgba(217, 119, 6, 0.12);
}

.header-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #92400e;
}

.header-desc {
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #78350f;
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
  width: 44rpx;
  height: 44rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #b45309;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rule-content {
  font-size: 27rpx;
  line-height: 1.8;
  color: #374151;
}
</style>
