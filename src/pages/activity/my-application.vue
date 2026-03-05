<script lang="ts" setup>
defineOptions({
  name: 'MyApplication',
})
definePage({
  style: {
    navigationBarTitleText: '我的申报',
  },
})

const applications = ref([
  {
    id: 1,
    brand: '比亚迪',
    model: '汉EV',
    status: '审核中',
    statusColor: '#ffa940',
    date: '2026-01-15',
  },
  {
    id: 2,
    brand: '特斯拉',
    model: 'Model 3',
    status: '已通过',
    statusColor: '#52c41a',
    date: '2026-01-10',
  },
])

function viewDetail(id: number) {
  uni.showToast({ title: '查看详情', icon: 'none' })
}
</script>

<template>
  <view class="page-container">
    <view class="application-list">
      <view v-for="item in applications" :key="item.id" class="application-card" @tap="viewDetail(item.id)">
        <view class="card-header">
          <view class="car-info">
            <view class="brand">
              {{ item.brand }}
            </view>
            <view class="model">
              {{ item.model }}
            </view>
          </view>
          <view class="status" :style="{ color: item.statusColor }">
            {{ item.status }}
          </view>
        </view>
        <view class="card-footer">
          <view class="date">
            申报日期：{{ item.date }}
          </view>
          <view class="arrow">
            ›
          </view>
        </view>
      </view>

      <view v-if="applications.length === 0" class="empty">
        <view class="empty-icon">
          📋
        </view>
        <view class="empty-text">
          暂无申报记录
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.application-list {
  padding: 40rpx;
}

.application-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .brand {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 8rpx;
  }

  .model {
    font-size: 28rpx;
    color: #999999;
  }

  .status {
    font-size: 28rpx;
    font-weight: 500;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .date {
    font-size: 24rpx;
    color: #999999;
  }

  .arrow {
    font-size: 40rpx;
    color: #cccccc;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }
}
</style>
