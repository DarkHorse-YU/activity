<script lang="ts" setup>
import type { AccountLoginReq } from '@/api/types/login'
import { getCaptcha } from '@/api/login'
import { useTokenStore } from '@/store/token'
import { encryptByRsa } from '@/utils/encrypt'

definePage({
  style: {
    navigationBarTitleText: '登录',
  },
})

const tokenStore = useTokenStore()

// 表单数据
const formData = reactive<AccountLoginReq>({
  username: '',
  password: '',
  captcha: '',
  uuid: '',
})

// 验证码相关
const captchaImg = ref('')
const isCaptchaEnabled = ref(true)
const captchaExpired = ref(false)
let captchaTimer: ReturnType<typeof setTimeout> | null = null

// 登录中状态
const loading = ref(false)

// 获取验证码
async function fetchCaptcha() {
  try {
    const res = await getCaptcha()
    console.log('验证码接口返回:', res)
    console.log('isEnabled 值:', res.isEnabled, '类型:', typeof res.isEnabled)
    captchaImg.value = res.img
    formData.uuid = res.uuid
    // 兼容多种可能的字段名：isEnabled, enabled, captchaEnabled
    const enabled = res.isEnabled ?? (res as any).enabled ?? (res as any).captchaEnabled ?? true
    console.log('最终 enabled 值:', enabled)
    isCaptchaEnabled.value = enabled
    captchaExpired.value = false

    // 设置验证码过期定时器
    if (captchaTimer) {
      clearTimeout(captchaTimer)
    }
    const expireTime = res.expireTime
    if (expireTime > 0) {
      captchaTimer = setTimeout(() => {
        captchaExpired.value = true
      }, expireTime)
    }
  }
  catch (error) {
    console.error('获取验证码失败:', error)
  }
}

// 登录
async function handleLogin() {
  if (!formData.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!formData.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  if (isCaptchaEnabled.value && !formData.captcha) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    // RSA 加密密码
    const encryptedPassword = encryptByRsa(formData.password)
    if (!encryptedPassword) {
      uni.showToast({ title: '密码加密失败', icon: 'none' })
      loading.value = false
      return
    }

    await tokenStore.accountLogin({
      ...formData,
      password: encryptedPassword,
    })

    // 登录成功，处理重定向
    const currentPage = getCurrentPages()[0] as any
    const redirect = currentPage?.options?.redirect || currentPage?.$page?.options?.redirect
    if (redirect) {
      const redirectPath = decodeURIComponent(redirect)
      uni.reLaunch({ url: redirectPath })
    }
    else {
      uni.navigateBack()
    }
  }
  catch (error) {
    console.error('登录失败:', error)
    // 登录失败刷新验证码
    fetchCaptcha()
    formData.captcha = ''
  }
  finally {
    loading.value = false
  }
}

// 微信登录
async function handleWxLogin() {
  try {
    await tokenStore.wxLogin()
    uni.navigateBack()
  }
  catch (error) {
    console.error('微信登录失败:', error)
  }
}

// 检查是否已登录
onMounted(() => {
  if (tokenStore.hasLogin) {
    uni.navigateBack()
    return
  }
  fetchCaptcha()
})

// 清理定时器
onBeforeUnmount(() => {
  if (captchaTimer) {
    clearTimeout(captchaTimer)
  }
})
</script>

<template>
  <view class="login-container">
    <view class="login-header">
      <text class="login-title">欢迎登录</text>
    </view>

    <view class="login-form">
      <!-- 用户名 -->
      <view class="form-item">
        <input
          v-model="formData.username"
          class="form-input"
          type="text"
          placeholder="请输入用户名"
          placeholder-class="placeholder"
        >
      </view>

      <!-- 密码 -->
      <view class="form-item">
        <input
          v-model="formData.password"
          class="form-input"
          type="password"
          placeholder="请输入密码"
          placeholder-class="placeholder"
        >
      </view>

      <!-- 验证码 -->
      <view v-if="isCaptchaEnabled" class="form-item captcha-item">
        <input
          v-model="formData.captcha"
          class="form-input captcha-input"
          type="text"
          placeholder="请输入验证码"
          placeholder-class="placeholder"
          maxlength="4"
        >
        <view class="captcha-box" @click="fetchCaptcha">
          <image v-if="captchaImg && !captchaExpired" class="captcha-img" :src="captchaImg" mode="aspectFit" />
          <view v-else class="captcha-expired">
            <text>{{ captchaExpired ? '已过期' : '获取验证码' }}</text>
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button class="login-btn" :loading="loading" @click="handleLogin">
        登录
      </button>

      <!-- 微信登录（仅小程序） -->
      <!-- #ifdef MP-WEIXIN -->
      <button class="wx-login-btn" open-type="getPhoneNumber" @getphonenumber="handleWxLogin">
        <text>微信快捷登录</text>
      </button>
      <!-- #endif -->
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  padding: 80rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-header {
  text-align: center;
  margin-bottom: 80rpx;
}

.login-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

.login-form {
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 32rpx;
}

.form-input {
  width: 100%;
  height: 96rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.placeholder {
  color: #bbb;
}

.captcha-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.captcha-input {
  flex: 1;
}

.captcha-box {
  width: 200rpx;
  height: 96rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-img {
  width: 100%;
  height: 100%;
}

.captcha-expired {
  font-size: 24rpx;
  color: #999;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
  margin-top: 40rpx;
}

.login-btn::after {
  border: none;
}

.wx-login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #07c160;
  color: #fff;
  font-size: 28rpx;
  border-radius: 48rpx;
  border: none;
  margin-top: 24rpx;
}

.wx-login-btn::after {
  border: none;
}
</style>
