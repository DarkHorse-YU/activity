<script lang="ts" setup>
defineOptions({
  name: 'CouponVerificationRules',
})

definePage({
  style: {
    navigationBarTitleText: '规则说明',
  },
})

const ruleSections = [
  {
    key: 'before',
    eyebrow: 'Before Verification',
    title: '核销前确认',
    tone: 'emerald',
    items: [
      '核销前请先确认当前券码、活动状态与使用门店是否匹配。',
      '如用户出示截图、转发内容或模糊码面，建议先核对关键信息后再操作。',
      '当页面提示不可用、已失效或已使用时，请停止核销并引导用户联系活动方。',
    ],
  },
  {
    key: 'during',
    eyebrow: 'During Verification',
    title: '核销操作规范',
    tone: 'gold',
    items: [
      '优先使用扫码核销，适合高频场景，可减少人工录入错误。',
      '扫码异常、设备权限受限或码面损坏时，可切换输码核销作为兜底方案。',
      '点击确认前请再次核对券码，避免重复核销或误操作。',
    ],
  },
  {
    key: 'after',
    eyebrow: 'After Verification',
    title: '核销后处理',
    tone: 'slate',
    items: [
      '核销成功后系统会自动生成记录，后续可在核销记录中查看详情。',
      '如活动要求上传凭证，请按提示及时补充，避免影响审核。',
      '若记录状态异常或资料被驳回，请根据页面提示重新处理或联系运营方。',
    ],
  },
]

const quickNotes = [
  '核销动作通常不可逆，请确认后再提交。',
  '同一券码是否支持重复使用，以活动配置为准。',
  '遇到网络异常时，建议不要频繁重复点击提交。',
]
</script>

<template>
  <view class="page-container">
    <view class="page-glow page-glow--top" />
    <view class="page-glow page-glow--bottom" />

    <view class="hero-panel">
      <view class="hero-head">
        <view class="hero-badge">
          Verification Guide
        </view>
      </view>

      <view class="hero-title">
        核销规则说明
      </view>
      <view class="hero-desc">
        覆盖核销前确认、核销中规范与核销后处理，帮助门店统一操作口径，减少误核销和资料缺失。
      </view>
    </view>

    <view class="content-stack">
      <view class="overview-card">
        <view class="overview-card__kicker">
          Process Overview
        </view>
        <view class="overview-card__title">
          建议按“确认信息、执行核销、查看记录”完成整套流程
        </view>
        <view class="overview-steps">
          <view class="overview-step">
            <view class="overview-step__index">
              01
            </view>
            <view class="overview-step__text">
              核对券码与活动条件
            </view>
          </view>
          <view class="overview-step">
            <view class="overview-step__index">
              02
            </view>
            <view class="overview-step__text">
              优先扫码，必要时输码
            </view>
          </view>
          <view class="overview-step">
            <view class="overview-step__index">
              03
            </view>
            <view class="overview-step__text">
              核销成功后查看记录或补传凭证
            </view>
          </view>
        </view>
      </view>

      <view class="section-list">
        <view
          v-for="section in ruleSections"
          :key="section.key"
          class="rule-card"
          :class="`rule-card--${section.tone}`"
        >
          <view class="rule-card__head">
            <view>
              <view class="rule-card__eyebrow">
                {{ section.eyebrow }}
              </view>
              <view class="rule-card__title">
                {{ section.title }}
              </view>
            </view>
          </view>

          <view class="rule-points">
            <view
              v-for="(item, index) in section.items"
              :key="item"
              class="rule-point"
            >
              <view class="rule-point__index">
                {{ index + 1 }}
              </view>
              <view class="rule-point__text">
                {{ item }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="notice-card">
        <view class="notice-card__label">
          操作提醒
        </view>
        <view class="notice-list">
          <view
            v-for="note in quickNotes"
            :key="note"
            class="notice-item"
          >
            <view class="notice-item__dot" />
            <view class="notice-item__text">
              {{ note }}
            </view>
          </view>
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

.hero-panel,
.content-stack {
  position: relative;
  z-index: 1;
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

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  letter-spacing: 1rpx;
  font-weight: 700;
  background: rgba(24, 91, 78, 0.1);
  color: #185b4e;
  border: 1rpx solid rgba(24, 91, 78, 0.14);
}

.hero-title {
  margin-top: 28rpx;
  font-size: 58rpx;
  font-weight: 800;
  line-height: 1.12;
  color: #1d1a16;
}

.hero-desc {
  margin-top: 18rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #5f5a52;
}

.content-stack {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 28rpx;
}

.overview-card {
  padding: 30rpx 28rpx;
  border-radius: 34rpx;
  background:
    radial-gradient(circle at top right, rgba(232, 180, 74, 0.18), transparent 32%),
    linear-gradient(135deg, #123c35 0%, #0d2924 62%, #081917 100%);
  box-shadow: 0 22rpx 52rpx rgba(9, 30, 28, 0.2);
}

.overview-card__kicker,
.rule-card__eyebrow {
  font-size: 20rpx;
  letter-spacing: 1.5rpx;
  text-transform: uppercase;
}

.overview-card__kicker {
  color: rgba(239, 236, 231, 0.68);
}

.overview-card__title {
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1.45;
  color: #fffdf7;
}

.overview-steps {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 26rpx;
}

.overview-step {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.overview-step__index {
  width: 60rpx;
  height: 60rpx;
  flex-shrink: 0;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 800;
  color: #0e2b26;
  background: #f3ead1;
}

.overview-step__text {
  font-size: 25rpx;
  line-height: 1.6;
  color: rgba(255, 253, 247, 0.88);
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.rule-card,
.notice-card {
  padding: 28rpx 26rpx;
  border-radius: 30rpx;
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 16rpx 34rpx rgba(48, 38, 24, 0.07);
}

.rule-card {
  background: rgba(255, 255, 255, 0.84);
}

.rule-card--emerald {
  background: linear-gradient(180deg, rgba(244, 249, 247, 0.98), rgba(255, 255, 255, 0.94));
}

.rule-card--gold {
  background: linear-gradient(180deg, rgba(255, 248, 234, 0.98), rgba(255, 255, 255, 0.94));
}

.rule-card--slate {
  background: linear-gradient(180deg, rgba(247, 245, 241, 0.98), rgba(255, 255, 255, 0.94));
}

.rule-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.rule-card__eyebrow {
  color: #8a7f72;
}

.rule-card__title {
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: #1d1a16;
}

.rule-points {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 22rpx;
}

.rule-point {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.rule-point__index {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 800;
  color: #185b4e;
  background: rgba(24, 91, 78, 0.1);
}

.rule-point__text {
  flex: 1;
  font-size: 25rpx;
  line-height: 1.75;
  color: #60584d;
}

.notice-card {
  background: rgba(255, 255, 255, 0.72);
}

.notice-card__label {
  font-size: 22rpx;
  font-weight: 700;
  color: #185b4e;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 18rpx;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.notice-item__dot {
  width: 14rpx;
  height: 14rpx;
  margin-top: 12rpx;
  flex-shrink: 0;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #1b6758 0%, #0f3f37 100%);
}

.notice-item__text {
  font-size: 24rpx;
  line-height: 1.7;
  color: #6d655a;
}

@media (max-width: 520rpx) {
  .hero-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 50rpx;
  }
}
</style>
