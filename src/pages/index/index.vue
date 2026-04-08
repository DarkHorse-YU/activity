<script lang="ts" setup>
defineOptions({ name: 'SystemHome' })

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const statusBarHeight = ref(0)
onMounted(() => {
  const info = uni.getSystemInfoSync()
  statusBarHeight.value = info.statusBarHeight || 44
})

const categories = ref([
  { key: 'subsidy', label: '补贴活动', color: '#e84040', icon: '/static/icons/subsidy.svg' },
  { key: 'coupon', label: '抢券活动', color: '#f0932b', icon: '/static/icons/coupon.svg' },
  { key: 'lottery', label: '抽奖活动', color: '#2ecc71', icon: '/static/icons/lottery.svg' },
])
const activeCategory = ref('')

const upcomingEvents = ref([
  {
    id: 1,
    title: '2026 春季汽车补贴活动',
    day: '10',
    month: 'JUNE',
    going: 20,
    startTime: '2026-06-10',
    endTime: '2026-06-30',
    bgColor: '#fde8e8',
    imageUrl: '',
    typeName: '补贴',
    typeColor: '#e84040',
    url: '/pages/activity/index',
  },
  {
    id: 2,
    title: '春季消费券大派送',
    day: '10',
    month: 'JUNE',
    going: 15,
    startTime: '2026-06-10',
    endTime: '2026-06-20',
    bgColor: '#dff0ff',
    imageUrl: '',
    typeName: '抢券',
    typeColor: '#f0932b',
    url: '/pages/coupon-activity/index',
  },
])

const nearbyEvents = ref([
  {
    id: 3,
    title: '附近补贴活动',
    day: '05',
    month: 'MAY',
    going: 5,
    location: '距您 1.2km',
    bgColor: '#fde8e8',
    url: '/pages/activity/index',
  },
  {
    id: 4,
    title: '附近抢券活动',
    day: '08',
    month: 'MAY',
    going: 12,
    location: '距您 2.5km',
    bgColor: '#dff0ff',
    url: '/pages/coupon-activity/index',
  },
])

const searchText = ref('')

function navigate(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page">
    <!-- ── Header ── -->
    <view class="header" :style="{ paddingTop: `${statusBarHeight}px` }">
      <!-- brand row -->
      <view class="topbar">
        <view class="app-logo-wrap">
          <image class="app-logo-img" src="/static/logo.svg" mode="aspectFit" />
        </view>
        <text class="app-name">云科惠</text>
      </view>

      <!-- search -->
      <view class="search-wrap">
        <view class="s-icon-wrap">
          <view class="s-circle" />
          <view class="s-handle" />
        </view>
        <text class="s-divider">|</text>
        <input
          v-model="searchText"
          class="s-input"
          placeholder="Search..."
          placeholder-class="s-ph"
        >
      </view>
    </view>

    <!-- category chips at boundary -->
    <scroll-view class="cats-scroll" scroll-x>
      <view class="cats-row">
        <view
          v-for="cat in categories"
          :key="cat.key"
          class="cat-chip"
          :style="{ background: cat.color }"
          @tap="activeCategory = activeCategory === cat.key ? '' : cat.key"
        >
          <view class="cat-icon-wrap">
            <image class="cat-icon-img" :src="cat.icon" mode="aspectFit" />
          </view>
          <text class="cat-label">{{ cat.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- ── Body ── -->
    <scroll-view class="body" scroll-y>
      <!-- Upcoming -->
      <view class="sec-head">
        <text class="sec-title">近期活动</text>
      </view>

      <view class="v-list">
        <view
          v-for="item in upcomingEvents"
          :key="item.id"
          class="ev-card"
          @tap="navigate(item.url)"
        >
          <view class="ev-img" :style="{ backgroundColor: item.bgColor }">
            <image
              v-if="item.imageUrl"
              class="ev-img-banner"
              :src="item.imageUrl"
              mode="aspectFill"
            />
            <view class="ev-img-mask" />
            <view class="type-badge">
              <text class="type-badge-icon" :style="{ color: item.typeColor }">{{ item.typeName }}</text>
            </view>
            <button class="card-share-btn" open-type="share">
              <text class="card-share-txt">分享</text>
            </button>
          </view>
          <view class="ev-info">
            <text class="ev-title">{{ item.title }}</text>
            <view class="ev-going">
              <view class="avatars">
                <view v-for="i in 3" :key="i" class="av" :style="{ left: `${(i - 1) * 18}rpx` }" />
              </view>
              <text class="going-txt">+{{ item.going }} 人参与</text>
            </view>
            <view class="ev-time-tag">
              <text class="time-tag-icon">📅</text>
              <text class="time-tag-text">{{ item.startTime }} 至 {{ item.endTime }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="safe-bottom" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
$white: #fff;
$bg: #f0f2f8;
$text1: #0f172a;
$text2: #475569;
$text3: #94a3b8;
$accent: #f59e0b;

.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg;
}

// ── Header ──
.header {
  background: linear-gradient(160deg, #3d3dcc 0%, #5252e0 100%);
  padding-left: 36rpx;
  padding-right: 36rpx;
  padding-bottom: 56rpx;
  border-radius: 0 0 56rpx 56rpx;
  flex-shrink: 0;
  box-shadow: 0 8rpx 40rpx rgba(61, 61, 204, 0.35);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding: 32rpx 0 40rpx;
}

.app-logo-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.app-logo-img {
  width: 56rpx;
  height: 56rpx;
  filter: brightness(0) invert(1);
}

.app-name {
  font-size: 44rpx;
  font-weight: 800;
  color: $white;
  letter-spacing: 6rpx;
}

.share-btn {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  border: none;
  line-height: 1;

  &::after {
    border: none;
  }
}

.share-btn-txt {
  font-size: 22rpx;
  color: $white;
  font-weight: 600;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;
  padding: 0 4rpx;
}

.s-icon-wrap {
  position: relative;
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.s-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.85);
}

.s-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14rpx;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 2rpx;
  transform: rotate(45deg);
  transform-origin: right center;
}

.s-divider {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  margin: 0 4rpx;
}

.s-input {
  flex: 1;
  font-size: 28rpx;
  color: $white;
}

.s-ph {
  color: rgba(255, 255, 255, 0.4);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
}

.filter-icon {
  font-size: 24rpx;
  color: $white;
}

.filter-txt {
  font-size: 24rpx;
  color: $white;
  font-weight: 600;
}

.cats-scroll {
  margin-top: -35rpx;
  position: relative;
  z-index: 10;
  width: 100%;
}

.cats-row {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  padding: 0 32rpx 4rpx;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 32rpx 16rpx 16rpx;
  border-radius: 999rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.18);
  &:active {
    opacity: 0.8;
  }
}

.cat-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-icon-img {
  width: 28rpx;
  height: 28rpx;
}

.cat-label {
  font-size: 26rpx;
  font-weight: 700;
  color: $white;
}

// ── Body ──
.body {
  flex: 1;
  overflow: hidden;
}

.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx 16rpx;
}

.sec-title {
  font-size: 32rpx;
  font-weight: 800;
  color: $text1;
}

.see-all {
  font-size: 24rpx;
  color: $text3;
}

// Vertical list
.v-list {
  padding: 0 28rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.ev-card {
  display: flex;
  flex-direction: column;
  background: $white;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  position: relative;
  &:active {
    opacity: 0.85;
  }
}

.ev-img {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.ev-img-banner {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ev-img-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.16) 100%);
}

.type-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: $white;
  border-radius: 16rpx;
  padding: 12rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.type-badge-icon {
  font-size: 26rpx;
  font-weight: 800;
}

.card-share-btn {
  position: absolute;
  top: 10rpx;
  right: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #3d3dcc, #6060e0);
  border: none;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(61, 61, 204, 0.35);
  &::after {
    border: none;
  }
}

.card-share-txt {
  font-size: 26rpx;
  color: $white;
  font-weight: 600;
}
.ev-info {
  padding: 20rpx 20rpx 24rpx;
}

.ev-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: $text1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 14rpx;
}

.ev-going {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 10rpx;
}

.avatars {
  position: relative;
  width: 66rpx;
  height: 34rpx;
}

.av {
  position: absolute;
  top: 0;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #a29bfe, #6c5ce7);
  border: 3rpx solid $white;
}

.going-txt {
  font-size: 22rpx;
  font-weight: 600;
  color: #5252e0;
}

.ev-time-tag {
  display: inline-flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
  margin-top: 8rpx;
}

.time-tag-icon {
  font-size: 24rpx;
  margin-right: 20rpx;
}

.time-tag-text {
  font-size: 24rpx;
  color: $text2;
  font-weight: 500;
}

// Invite
.invite-banner {
  margin: 0 28rpx 8rpx;
  background: linear-gradient(135deg, #b2f0f0, #80e8e8);
  border-radius: 28rpx;
  padding: 32rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.invite-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.invite-title {
  font-size: 32rpx;
  font-weight: 800;
  color: $text1;
}

.invite-sub {
  font-size: 22rpx;
  color: $text2;
}

.invite-cta {
  margin-top: 16rpx;
  padding: 14rpx 36rpx;
  border-radius: 999rpx;
  background: #00c4b4;
  display: inline-flex;
  align-items: center;
  &:active {
    opacity: 0.8;
  }
}

.invite-cta-txt {
  font-size: 24rpx;
  font-weight: 700;
  color: $white;
}

.invite-emoji {
  font-size: 110rpx;
}

// Nearby
.nearby-list {
  padding: 0 28rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.nearby-card {
  display: flex;
  background: $white;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
  &:active {
    opacity: 0.85;
  }
}

.nearby-img {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
}

.nearby-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  min-width: 0;
}

.safe-bottom {
  height: calc(40rpx + env(safe-area-inset-bottom));
}
</style>
