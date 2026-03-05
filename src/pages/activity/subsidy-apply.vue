<script lang="ts" setup>
defineOptions({
  name: 'SubsidyApply',
})
definePage({
  style: {
    navigationBarTitleText: '补贴申报',
  },
})

const formData = ref({
  carBrand: '',
  carModel: '',
  vin: '',
  purchaseDate: '',
})

function handleSubmit() {
  uni.showToast({ title: '提交成功', icon: 'success' })
}
</script>

<template>
  <view class="page-container">
    <view class="form-card">
      <view class="form-title">
        补贴申报
      </view>

      <view class="form-item">
        <view class="label">
          汽车品牌
        </view>
        <input v-model="formData.carBrand" placeholder="请输入汽车品牌" class="input">
      </view>

      <view class="form-item">
        <view class="label">
          车型
        </view>
        <input v-model="formData.carModel" placeholder="请输入车型" class="input">
      </view>

      <view class="form-item">
        <view class="label">
          车架号
        </view>
        <input v-model="formData.vin" placeholder="请输入车架号" class="input">
      </view>

      <view class="form-item">
        <view class="label">
          购车日期
        </view>
        <input v-model="formData.purchaseDate" placeholder="请选择购车日期" class="input">
      </view>

      <view class="submit-btn" @tap="handleSubmit">
        提交申报
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.form-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
}

.form-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 48rpx;
  text-align: center;
}

.form-item {
  margin-bottom: 32rpx;

  .label {
    font-size: 28rpx;
    color: #666666;
    margin-bottom: 16rpx;
  }

  .input {
    height: 88rpx;
    background: #f5f5f5;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 30rpx;
  }
}

.submit-btn {
  height: 96rpx;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  margin-top: 48rpx;
}
</style>
