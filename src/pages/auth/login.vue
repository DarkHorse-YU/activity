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

// 登录成功后要跳转的目标页面（通过 onLoad 获取）
const redirectUrl = ref<string | null>(null)

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
    captchaImg.value = res.img
    formData.uuid = res.uuid
    // 兼容多种可能的字段名：isEnabled, enabled, captchaEnabled
    isCaptchaEnabled.value = res.isEnabled ?? (res as any).enabled ?? (res as any).captchaEnabled ?? true
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
    if (redirectUrl.value) {
      const targetUrl = decodeURIComponent(redirectUrl.value)
      console.log('登录成功，跳转到:', targetUrl)
      // 使用 redirectTo 关闭登录页，保留首页在栈中，用户可以返回首页
      uni.redirectTo({ url: targetUrl })
    }
    else {
      // 没有重定向地址，返回上一页或首页
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      }
      else {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    }
  }
  catch (error) {
    console.error('登录失败:', error)
    // 登录失败刷新验证码
    await fetchCaptcha()
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
    // 微信登录成功后也要处理重定向
    if (redirectUrl.value) {
      const targetUrl = decodeURIComponent(redirectUrl.value)
      // 使用 redirectTo 关闭登录页，用户可以返回首页
      uni.redirectTo({ url: targetUrl })
    }
    else {
      uni.navigateBack()
    }
  }
  catch (error) {
    console.error('微信登录失败:', error)
  }
}

// 页面加载时获取 redirect 参数
onLoad((query: Record<string, any>) => {
  // 解析查询参数
  if (query.redirect) {
    redirectUrl.value = query.redirect as string
  }
  else {
    redirectUrl.value = null
  }

  // 如果已登录，直接处理跳转
  if (tokenStore.hasLogin) {
    if (redirectUrl.value) {
      // 使用 redirectTo 关闭登录页
      uni.redirectTo({ url: decodeURIComponent(redirectUrl.value) })
    }
    else {
      uni.navigateBack()
    }
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
    <!-- 背景装饰 - 增强视觉层次 -->
    <view class="bg-decoration">
      <view class="bg-circle bg-circle-1" />
      <view class="bg-circle bg-circle-2" />
      <view class="bg-circle bg-circle-3" />
    </view>

    <view class="login-content">
      <!-- 头部区域 - 清晰的视觉层级 -->
      <view class="login-header">
        <view class="header-icon" role="img" aria-label="登录图标">
          <view class="icon-inner">
            <view class="icon-lock" />
          </view>
        </view>
        <text class="login-title">欢迎回来</text>
        <text class="login-subtitle">登录您的账户以继续</text>
      </view>

      <!-- 表单卡片 - Glassmorphism 效果 -->
      <view class="login-form" role="form" aria-label="登录表单">
        <!-- 用户名 -->
        <view class="form-item">
          <label class="input-label" for="username">
            <text>用户名</text>
          </label>
          <view class="input-wrapper">
            <view class="input-icon">
              <view class="icon-user" />
            </view>
            <input
              id="username"
              v-model="formData.username"
              class="form-input"
              type="text"
              placeholder="请输入用户名"
              placeholder-class="placeholder"
              autocomplete="username"
              aria-required="true"
            >
          </view>
        </view>

        <!-- 密码 -->
        <view class="form-item">
          <label class="input-label" for="password">
            <text>密码</text>
          </label>
          <view class="input-wrapper">
            <view class="input-icon">
              <view class="icon-pwd" />
            </view>
            <input
              id="password"
              v-model="formData.password"
              class="form-input"
              password
              placeholder="请输入密码"
              placeholder-class="placeholder"
              autocomplete="current-password"
              aria-required="true"
            >
          </view>
        </view>

        <!-- 验证码 -->
        <view v-if="isCaptchaEnabled" class="form-item">
          <label class="input-label" for="captcha">
            <text>验证码</text>
          </label>
          <view class="captcha-row">
            <view class="input-wrapper captcha-wrapper">
              <view class="input-icon">
                <view class="icon-captcha" />
              </view>
              <input
                id="captcha"
                v-model="formData.captcha"
                class="form-input captcha-input"
                type="text"
                placeholder="请输入验证码"
                placeholder-class="placeholder"
                :maxlength="4"
                aria-required="true"
              >
            </view>
            <view
              class="captcha-box"
              role="button"
              aria-label="点击刷新验证码"
              tabindex="0"
              @click="fetchCaptcha"
              @keydown.enter="fetchCaptcha"
            >
              <image
                v-if="captchaImg && !captchaExpired"
                class="captcha-img"
                :src="captchaImg"
                mode="aspectFit"
                alt="验证码图片"
              />
              <view v-else class="captcha-expired">
                <text>{{ captchaExpired ? '点击刷新' : '获取验证码' }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 登录按钮 -->
        <button
          class="login-btn"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          :aria-busy="loading"
          @click="handleLogin"
        >
          <text v-if="!loading">登录</text>
          <view v-else class="btn-loading">
            <view class="loading-spinner" />
            <text>登录中...</text>
          </view>
        </button>

        <!-- 微信登录（仅小程序） -->
        <!-- #ifdef MP-WEIXIN -->
        <view class="divider" role="separator">
          <view class="divider-line" />
          <text class="divider-text">其他登录方式</text>
          <view class="divider-line" />
        </view>
        <button
          class="wx-login-btn"
          open-type="getPhoneNumber"
          aria-label="微信快捷登录"
          @getphonenumber="handleWxLogin"
        >
          <view class="wx-icon" />
          <text>微信快捷登录</text>
        </button>
        <!-- #endif -->
      </view>

      <!-- 底部装饰 -->
      <view class="footer-decoration">
        <text class="footer-text">安全登录 · 数据加密</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// ========================================
// DESIGN SYSTEM VARIABLES
// ========================================
$primary: #f99c5f;
$primary-light: #fbb97d;
$primary-dark: #e88a4a;
$bg-warm: #fff7f0;
$bg-neutral: #fafafa;
$bg-light: #f5f5f5;
$text-primary: #1a1a1a;
$text-secondary: #666666;
$text-muted: #999999;
$border-light: rgba(0, 0, 0, 0.06);
$glass-bg: rgba(255, 255, 255, 0.85);
$glass-border: rgba(255, 255, 255, 0.5);
$shadow-soft: 0 8rpx 32rpx rgba(249, 156, 95, 0.15);
$shadow-card:
  0 4rpx 16rpx rgba(0, 0, 0, 0.04),
  0 16rpx 48rpx rgba(0, 0, 0, 0.06);
$radius-lg: 32rpx;
$radius-md: 16rpx;
$radius-full: 9999rpx;
$transition-fast: 150ms ease-out;
$transition-normal: 200ms ease-out;

// ========================================
// REDUCED MOTION SUPPORT (仅 H5)
// ========================================
/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
/* #endif */

// ========================================
// CONTAINER & BACKGROUND
// ========================================
.login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg-warm 0%, $bg-neutral 40%, $bg-light 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 背景装饰 - 增强层次感
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 600rpx;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;

  &.bg-circle-1 {
    width: 500rpx;
    height: 500rpx;
    background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
    top: -200rpx;
    right: -150rpx;
    filter: blur(100rpx);
    opacity: 0.5;
    animation-delay: 0s;
  }

  &.bg-circle-2 {
    width: 350rpx;
    height: 350rpx;
    background: linear-gradient(135deg, $primary-light 0%, #fcd5b5 100%);
    top: 200rpx;
    left: -100rpx;
    filter: blur(80rpx);
    opacity: 0.4;
    animation-delay: -2s;
  }

  &.bg-circle-3 {
    width: 200rpx;
    height: 200rpx;
    background: linear-gradient(135deg, #fcd5b5 0%, #fff 100%);
    top: 100rpx;
    right: 20%;
    filter: blur(60rpx);
    opacity: 0.3;
    animation-delay: -4s;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20rpx) scale(1.02);
  }
}

// ========================================
// CONTENT LAYOUT
// ========================================
.login-content {
  position: relative;
  z-index: 1;
  padding: 60rpx 40rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

// ========================================
// HEADER SECTION
// ========================================
.login-header {
  text-align: center;
  margin-bottom: 48rpx;
}

.header-icon {
  width: 128rpx;
  height: 128rpx;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28rpx;
  box-shadow: $shadow-soft;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -8rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba($primary, 0.2) 0%, rgba($primary-light, 0.1) 100%);
    animation: pulse-ring 2s ease-out infinite;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.icon-inner {
  width: 56rpx;
  height: 56rpx;
  position: relative;
}

.icon-lock {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 8rpx;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -12rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 32rpx;
    height: 24rpx;
    border: 4rpx solid #fff;
    border-bottom: none;
    border-radius: 16rpx 16rpx 0 0;
  }
}

.login-title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 12rpx;
  letter-spacing: -0.5rpx;
}

.login-subtitle {
  font-size: 28rpx;
  color: $text-muted;
  font-weight: 400;
}

// ========================================
// FORM CARD - GLASSMORPHISM
// ========================================
.login-form {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: $radius-lg;
  padding: 48rpx 36rpx;
  box-shadow: $shadow-card;
  border: 1rpx solid $glass-border;
  transition:
    transform $transition-normal,
    box-shadow $transition-normal;

  &:active {
    transform: scale(0.995);
  }
}

// ========================================
// FORM ITEMS
// ========================================
.form-item {
  margin-bottom: 28rpx;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  font-weight: 500;
  margin-bottom: 12rpx;
  letter-spacing: 0.5rpx;
}

// Input wrapper with icon
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 24rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

// SVG-like icons using CSS
.icon-user {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 3rpx solid $text-muted;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -10rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 44rpx;
    height: 20rpx;
    border: 3rpx solid $text-muted;
    border-top: none;
    border-radius: 0 0 22rpx 22rpx;
  }
}

.icon-pwd {
  width: 32rpx;
  height: 36rpx;
  border: 3rpx solid $text-muted;
  border-radius: 6rpx;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -12rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 20rpx;
    height: 16rpx;
    border: 3rpx solid $text-muted;
    border-bottom: none;
    border-radius: 10rpx 10rpx 0 0;
  }
}

.icon-captcha {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid $text-muted;
  border-radius: 4rpx;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 6rpx;
    left: 6rpx;
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: $text-muted;
  }
}

.form-input {
  width: 100%;
  height: 100rpx;
  padding: 0 24rpx 0 76rpx;
  font-size: 30rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: $radius-md;
  border: 2rpx solid transparent;
  box-sizing: border-box;
  transition: all $transition-fast;
  color: $text-primary;

  &:focus {
    border-color: $primary;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba($primary, 0.1);
  }

  &[aria-invalid='true'] {
    border-color: #ff4d4f;
  }
}

.placeholder {
  color: #bbbbbb;
}

// ========================================
// CAPTCHA ROW
// ========================================
.captcha-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.captcha-wrapper {
  flex: 1;
}

.captcha-input {
  flex: 1;
}

.captcha-box {
  width: 200rpx;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: $radius-md;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $border-light;
  cursor: pointer;
  transition: all $transition-fast;

  &:active {
    transform: scale(0.98);
    border-color: $primary;
  }

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 4rpx rgba($primary, 0.1);
  }
}

.captcha-img {
  width: 100%;
  height: 100%;
}

.captcha-expired {
  font-size: 24rpx;
  color: $primary;
  font-weight: 500;
  text-align: center;
  padding: 0 12rpx;
}

// ========================================
// LOGIN BUTTON
// ========================================
.login-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: $radius-full;
  border: none;
  margin-top: 36rpx;
  box-shadow: $shadow-soft;
  transition: all $transition-normal;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: none;
    box-shadow:
      $shadow-soft,
      0 0 0 4rpx rgba($primary, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &.is-loading {
    pointer-events: none;
  }

  &::after {
    border: none;
  }
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ========================================
// DIVIDER
// ========================================
.divider {
  display: flex;
  align-items: center;
  margin: 36rpx 0;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $border-light, transparent);
}

.divider-text {
  padding: 0 28rpx;
  font-size: 24rpx;
  color: $text-muted;
  font-weight: 400;
}

// ========================================
// WECHAT LOGIN BUTTON
// ========================================
.wx-login-btn {
  width: 100%;
  height: 100rpx;
  background: #07c160;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: $radius-full;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.25);
  transition: all $transition-normal;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: none;
    box-shadow:
      0 8rpx 24rpx rgba(7, 193, 96, 0.25),
      0 0 0 4rpx rgba(7, 193, 96, 0.2);
  }

  &::after {
    border: none;
  }
}

.wx-icon {
  width: 40rpx;
  height: 40rpx;
  background: #fff;
  border-radius: 50%;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 12rpx;
    height: 12rpx;
    background: #07c160;
    border-radius: 50%;
    top: 10rpx;
  }

  &::before {
    left: 10rpx;
  }

  &::after {
    right: 10rpx;
  }
}

// ========================================
// FOOTER DECORATION
// ========================================
.footer-decoration {
  text-align: center;
  margin-top: 40rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.footer-text {
  font-size: 22rpx;
  color: $text-muted;
  opacity: 0.7;
}
</style>
