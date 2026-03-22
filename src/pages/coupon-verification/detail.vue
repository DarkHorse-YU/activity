<script lang="ts" setup>
import type {
  ICouponReviewDetail,
  ICouponReviewFieldIssue,
  ICouponReviewFormField,
} from '@/api/types/coupon-verification'
import {
  getCouponReviewDetail,
  resubmitCouponReviewVoucher,
  uploadWriteOffFile,
} from '@/api/coupon-verification'

defineOptions({
  name: 'CouponVerificationDetail',
})

definePage({
  style: {
    navigationBarTitleText: '核销详情',
  },
})

interface FieldExtraInfo {
  fileId?: number
  ocrAutofill?: 1
}

const loading = ref(true)
const recordId = ref<number>()
const activeTab = ref(0)
const detail = ref<ICouponReviewDetail | null>(null)
const formData = ref<Record<string, any>>({})
const fieldErrors = ref<Record<string, string>>({})
const fieldExtraInfo = ref<Record<string, FieldExtraInfo>>({})
const uploadingFields = ref<Set<string>>(new Set())
const issueMap = ref<Map<string, ICouponReviewFieldIssue>>(new Map())

// 状态配置
const statusConfig: Record<string, { text: string, color: string, bg: string, dotColor: string }> = {
  PENDING_UPLOAD: { text: '待上传凭证', color: '#b45309', bg: 'rgba(217, 119, 6, 0.1)', dotColor: '#d97706' },
  PENDING_AUDIT: { text: '审核中', color: '#1d4ed8', bg: 'rgba(29, 78, 216, 0.1)', dotColor: '#2563eb' },
  REJECTED: { text: '已驳回', color: '#b91c1c', bg: 'rgba(185, 28, 28, 0.1)', dotColor: '#dc2626' },
  APPROVED: { text: '已通过', color: '#15803d', bg: 'rgba(21, 128, 61, 0.1)', dotColor: '#16a34a' },
  CANCELLED: { text: '已撤销', color: '#475569', bg: 'rgba(71, 85, 105, 0.1)', dotColor: '#64748b' },
}

function getStatusConfig(status: string) {
  return statusConfig[status] || statusConfig.CANCELLED
}

// 计算属性
const groupCount = computed(() => detail.value?.currentSubmission?.groups?.length || 0)
const currentGroup = computed(() => detail.value?.currentSubmission?.groups?.[activeTab.value])
const isFirstTab = computed(() => activeTab.value === 0)
const isLastTab = computed(() => activeTab.value === groupCount.value - 1)
const isRejected = computed(() => detail.value?.status === 'REJECTED')
const issues = computed(() => detail.value?.currentSubmission?.issues || [])

// 获取详情
async function fetchDetail(id: number) {
  try {
    loading.value = true
    detail.value = await getCouponReviewDetail(id)
    initFormData()
    buildIssueMap()
  }
  catch (error) {
    console.error('获取核销详情失败:', error)
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

// 初始化表单数据
function initFormData() {
  const groups = detail.value?.currentSubmission?.groups || []
  groups.forEach((group) => {
    group.fields.forEach((field) => {
      formData.value[field.fieldCode] = field.value || ''
      if (field.fileId) {
        fieldExtraInfo.value[field.fieldCode] = { fileId: field.fileId }
      }
    })
  })
}

// 构建问题映射
function buildIssueMap() {
  issueMap.value.clear()
  const issueList = detail.value?.currentSubmission?.issues || []
  issueList.forEach((issue) => {
    issueMap.value.set(issue.fieldCode, issue)
  })
}

function hasIssue(fieldCode: string): boolean {
  return issueMap.value.has(fieldCode)
}

function getIssue(fieldCode: string): ICouponReviewFieldIssue | undefined {
  return issueMap.value.get(fieldCode)
}

function switchTab(index: number) {
  if (index >= 0 && index < groupCount.value) {
    activeTab.value = index
  }
}

function prevStep() {
  if (activeTab.value > 0)
    activeTab.value--
}

function nextStep() {
  if (activeTab.value < groupCount.value - 1)
    activeTab.value++
}

function parseEnumOptions(options: string | null): string[] {
  if (!options)
    return []
  try {
    return JSON.parse(options)
  }
  catch {
    return options.split(',').map(s => s.trim())
  }
}

function parseValidationRule(rule: string | null): Record<string, any> {
  if (!rule)
    return {}
  try {
    return JSON.parse(rule)
  }
  catch {
    return {}
  }
}

function validateField(field: ICouponReviewFormField, value: any): string | null {
  if (!value)
    return null
  const rule = parseValidationRule(field.validationRule)
  if (!rule || Object.keys(rule).length === 0)
    return null

  const strValue = String(value)
  const regexPattern = rule.regex || rule.pattern
  if (regexPattern) {
    try {
      const regex = new RegExp(regexPattern)
      if (!regex.test(strValue)) {
        return rule.message || `${field.fieldName}格式不正确`
      }
    }
    catch {
      console.warn('正则表达式无效:', regexPattern)
    }
  }
  return null
}

function handleFieldBlur(field: ICouponReviewFormField) {
  const value = formData.value[field.fieldCode]
  const error = validateField(field, value)
  if (error) {
    fieldErrors.value[field.fieldCode] = error
  }
  else {
    delete fieldErrors.value[field.fieldCode]
  }
  if (value) {
    issueMap.value.delete(field.fieldCode)
  }
}

function handlePickerChange(field: ICouponReviewFormField, value: string) {
  formData.value[field.fieldCode] = value
  issueMap.value.delete(field.fieldCode)
  delete fieldErrors.value[field.fieldCode]
}

function isFieldDisabled(field: ICouponReviewFormField): boolean {
  if (!isRejected.value)
    return true
  if (field.isEditable === 0)
    return true
  return false
}

async function uploadImage(field: ICouponReviewFormField) {
  if (uploadingFields.value.has(field.fieldCode) || isFieldDisabled(field))
    return

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uploadingFields.value.add(field.fieldCode)

      try {
        const uploadRes = await uploadWriteOffFile(tempFilePath, {
          needOcr: field.ocrEnabled === 1,
          ocrMappingKey: field.ocrMappingKey,
        })

        formData.value[field.fieldCode] = uploadRes.url
        fieldExtraInfo.value[field.fieldCode] = {
          ...fieldExtraInfo.value[field.fieldCode],
          fileId: uploadRes.fileId,
        }
        issueMap.value.delete(field.fieldCode)

        if (uploadRes.ocrResult && Object.keys(uploadRes.ocrResult).length > 0) {
          fillOcrResult(uploadRes.ocrResult, uploadRes.fileId)
          uni.showToast({ title: '识别成功', icon: 'success' })
        }
        else {
          uni.showToast({ title: '上传成功', icon: 'success' })
        }
      }
      catch (error: any) {
        console.error('上传失败:', error)
        uni.showToast({ title: error?.message || '上传失败', icon: 'none' })
      }
      finally {
        uploadingFields.value.delete(field.fieldCode)
      }
    },
    fail: () => {
      uni.showToast({ title: '取消选择', icon: 'none' })
    },
  })
}

function fillOcrResult(ocrResult: Record<string, string>, fileId: number) {
  const allFields = detail.value?.currentSubmission?.groups?.flatMap(g => g.fields) || []

  Object.entries(ocrResult).forEach(([key, value]) => {
    const targetField = allFields.find(f => f.fieldName === key)
    if (targetField && value && !isFieldDisabled(targetField)) {
      formData.value[targetField.fieldCode] = value
      if (!fieldExtraInfo.value[targetField.fieldCode]) {
        fieldExtraInfo.value[targetField.fieldCode] = {}
      }
      fieldExtraInfo.value[targetField.fieldCode].fileId = fileId
      fieldExtraInfo.value[targetField.fieldCode].ocrAutofill = 1
      delete fieldErrors.value[targetField.fieldCode]
      issueMap.value.delete(targetField.fieldCode)
    }
  })
}

async function resubmit() {
  if (Object.keys(fieldErrors.value).length > 0) {
    uni.showToast({ title: '请修正表单中的错误', icon: 'none' })
    return
  }

  if (issueMap.value.size > 0) {
    uni.showToast({ title: '请修改所有问题字段', icon: 'none' })
    return
  }

  const allFields = detail.value?.currentSubmission?.groups?.flatMap(g => g.fields) || []

  for (const field of allFields) {
    const value = formData.value[field.fieldCode]
    if (field.isRequired === 1 && !value) {
      uni.showToast({ title: `请填写${field.fieldName}`, icon: 'none' })
      return
    }
    const validationError = validateField(field, value)
    if (validationError) {
      uni.showToast({ title: validationError, icon: 'none' })
      return
    }
  }

  const fieldValues = allFields.map((field) => {
    const value = formData.value[field.fieldCode]
    const extraInfo = fieldExtraInfo.value[field.fieldCode] || {}

    const fieldValue: {
      fieldCode: string
      value: any
      fileId?: number
      ocrAutofill?: 0 | 1
    } = {
      fieldCode: field.fieldCode,
      value,
    }

    if (extraInfo.fileId)
      fieldValue.fileId = extraInfo.fileId
    if (extraInfo.ocrAutofill)
      fieldValue.ocrAutofill = 1

    return fieldValue
  })

  const submitData = { fieldValues }
  const id = detail.value?.id

  try {
    uni.showLoading({ title: '提交中...' })
    await resubmitCouponReviewVoucher(id!, submitData)
    uni.hideLoading()
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/coupon-verification/records' })
    }, 1500)
  }
  catch (error) {
    uni.hideLoading()
    console.error('提交失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}

function handleBottomAction() {
  if (groupCount.value === 1 || isLastTab.value) {
    resubmit()
  }
  else {
    nextStep()
  }
}

onLoad((query: Record<string, any>) => {
  const id = query.id
  if (id) {
    recordId.value = Number(id)
    fetchDetail(Number(id))
  }
  else {
    uni.showToast({ title: '缺少参数', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<template>
  <view class="page-container">
    <!-- 背景装饰 -->
    <view class="page-glow page-glow--top" />
    <view class="page-glow page-glow--bottom" />

    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-icon-wrapper">
        <wd-loading size="40px" />
      </view>
      <text class="loading-text">加载详情中...</text>
    </view>

    <!-- 详情内容 -->
    <view v-else-if="detail" class="content">
      <!-- 顶部状态区 -->
      <view class="hero-panel">
        <view class="hero-head">
          <view class="hero-badge">
            Verification Detail
          </view>
          <view class="hero-status" :style="{ background: getStatusConfig(detail.status).bg, color: getStatusConfig(detail.status).color }">
            <view class="status-dot" :style="{ background: getStatusConfig(detail.status).dotColor }" />
            {{ detail.statusDesc || getStatusConfig(detail.status).text }}
          </view>
        </view>
        <view class="hero-title">
          核销详情
        </view>
        <view class="hero-desc">
          查看核销信息、审核状态与问题反馈，驳回后可修改重新提交。
        </view>
      </view>

      <!-- 优惠券信息卡片 -->
      <view class="coupon-card">
        <view class="coupon-card__header">
          <view class="coupon-type-tag">
            {{ detail.couponType === 'CASH' ? '满减券' : '折扣券' }}
          </view>
          <view class="coupon-discount">
            <template v-if="detail.couponType === 'CASH' && detail.discountAmount">
              ¥{{ detail.discountAmount }}
            </template>
            <template v-else-if="detail.couponType === 'DISCOUNT' && detail.discountRate">
              {{ (detail.discountRate * 10).toFixed(1) }}折
            </template>
            <template v-else>
              -
            </template>
          </view>
        </view>
        <view class="coupon-card__name">
          {{ detail.templateName || '优惠券' }}
        </view>
        <view class="coupon-card__info">
          <view class="info-row">
            <text class="info-label">券编码</text>
            <text class="info-value">{{ detail.couponNo }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">所属活动</text>
            <text class="info-value">{{ detail.activityName }}</text>
          </view>
          <view v-if="detail.couponType === 'CASH' && detail.thresholdAmount" class="info-row">
            <text class="info-label">使用条件</text>
            <text class="info-value">满¥{{ detail.thresholdAmount }}可用</text>
          </view>
          <view class="info-row">
            <text class="info-label">核销方式</text>
            <text class="info-value">{{ detail.writeOffMode === 'QR_SCAN' ? '扫码核销' : '输码核销' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">核销时间</text>
            <text class="info-value">{{ detail.writeOffTime || '--' }}</text>
          </view>
          <view v-if="detail.auditTime" class="info-row">
            <text class="info-label">审核时间</text>
            <text class="info-value">{{ detail.auditTime }}</text>
          </view>
        </view>
      </view>

      <!-- 驳回问题提示 -->
      <view v-if="isRejected && issues.length > 0" class="reject-panel">
        <view class="reject-panel__head">
          <view class="reject-panel__icon">
            <text>!</text>
          </view>
          <view class="reject-panel__title">
            审核驳回 · 需修改 {{ issues.length }} 项
          </view>
        </view>
        <view class="issue-list">
          <view v-for="item in issues" :key="item.id" class="issue-item">
            <view class="issue-item__field">
              {{ item.fieldName }}
            </view>
            <view class="issue-item__message">
              {{ item.issueMessage }}
            </view>
          </view>
        </view>
      </view>

      <!-- 审核意见 -->
      <view v-if="detail.auditComment" class="comment-panel">
        <view class="comment-panel__head">
          <view class="comment-panel__icon">
            <text>📝</text>
          </view>
          <view class="comment-panel__title">
            审核意见
          </view>
        </view>
        <view class="comment-panel__content">
          {{ detail.auditComment }}
        </view>
      </view>

      <!-- 多分组 Tab -->
      <view v-if="groupCount > 1" class="tabs-panel">
        <view
          v-for="(group, index) in detail.currentSubmission?.groups"
          :key="index"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @tap="switchTab(index)"
        >
          <text class="tab-text">{{ group.groupName }}</text>
          <view v-if="activeTab === index" class="tab-indicator" />
        </view>
      </view>

      <!-- 表单卡片 -->
      <view v-if="currentGroup" class="form-panel">
        <!-- 分组标题 -->
        <view v-if="groupCount > 1" class="form-group-head">
          <view class="form-group__step">
            {{ activeTab + 1 }}/{{ groupCount }}
          </view>
          <view class="form-group__title">
            {{ currentGroup.groupName }}
          </view>
        </view>
        <view v-else class="form-section-head">
          <view class="form-section__kicker">
            Form Fields
          </view>
          <view class="form-section__title">
            {{ currentGroup.groupName || '凭证信息' }}
          </view>
        </view>

        <!-- 表单字段 -->
        <view class="form-fields">
          <view
            v-for="field in currentGroup.fields"
            :key="field.fieldId"
            class="field-item"
            :class="{ 'has-issue': hasIssue(field.fieldCode) }"
          >
            <!-- 字段问题提示 -->
            <view v-if="hasIssue(field.fieldCode)" class="field-issue">
              <view class="field-issue__icon">
                !
              </view>
              <text class="field-issue__text">{{ getIssue(field.fieldCode)?.issueMessage }}</text>
            </view>

            <!-- 字段标签 -->
            <view class="field-label">
              <text class="field-label__text">{{ field.fieldName }}</text>
              <text v-if="field.isRequired === 1" class="field-label__required">*</text>
              <view v-if="hasIssue(field.fieldCode)" class="field-label__badge">
                需修改
              </view>
            </view>

            <!-- 文本/数字/手机/金额输入 -->
            <template v-if="['text', 'number', 'phone', 'money'].includes(field.fieldType)">
              <input
                v-model="formData[field.fieldCode]"
                class="field-input"
                :class="{ 'is-disabled': isFieldDisabled(field), 'has-error': fieldErrors[field.fieldCode] || hasIssue(field.fieldCode) }"
                :disabled="isFieldDisabled(field)"
                :type="field.fieldType === 'money' ? 'digit' : field.fieldType === 'text' ? 'text' : 'number'"
                :placeholder="`请输入${field.fieldName}`"
                placeholder-class="field-placeholder"
                @blur="handleFieldBlur(field)"
              >
              <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
            </template>

            <!-- 日期选择 -->
            <picker
              v-else-if="field.fieldType === 'date'"
              mode="date"
              :value="formData[field.fieldCode] || ''"
              @change="(e: any) => handlePickerChange(field, e.detail.value)"
            >
              <view class="field-picker" :class="{ 'is-disabled': isFieldDisabled(field), 'has-value': formData[field.fieldCode] }">
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="field-placeholder">请选择{{ field.fieldName }}</text>
                <text class="field-picker__arrow">›</text>
              </view>
            </picker>

            <!-- 枚举选择 -->
            <picker
              v-else-if="field.fieldType === 'enum'"
              mode="selector"
              :range="parseEnumOptions(field.enumOptions)"
              :value="Math.max(parseEnumOptions(field.enumOptions).indexOf(formData[field.fieldCode]), 0)"
              @change="(e: any) => handlePickerChange(field, parseEnumOptions(field.enumOptions)[e.detail.value])"
            >
              <view class="field-picker" :class="{ 'is-disabled': isFieldDisabled(field), 'has-value': formData[field.fieldCode] }">
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="field-placeholder">请选择{{ field.fieldName }}</text>
                <text class="field-picker__arrow">›</text>
              </view>
            </picker>

            <!-- 图片上传 -->
            <view v-else-if="field.fieldType === 'image'" class="field-upload">
              <view
                class="upload-box"
                :class="{ 'is-disabled': isFieldDisabled(field), 'has-image': formData[field.fieldCode] || field.fileUrl }"
                @tap="!isFieldDisabled(field) && uploadImage(field)"
              >
                <image
                  v-if="formData[field.fieldCode] || field.fileUrl"
                  :src="formData[field.fieldCode] || field.fileUrl"
                  class="upload-preview"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <text class="upload-placeholder__icon">+</text>
                  <text class="upload-placeholder__text">上传图片</text>
                  <text v-if="field.ocrEnabled === 1" class="upload-placeholder__ocr">OCR识别</text>
                </view>
              </view>
              <view v-if="uploadingFields.has(field.fieldCode)" class="upload-mask">
                <wd-loading size="24px" />
              </view>
            </view>

            <!-- 文件上传 -->
            <view v-else-if="field.fieldType === 'file'" class="field-file">
              <view class="field-file__card" :class="{ 'is-disabled': isFieldDisabled(field) }">
                <text class="field-file__icon">📄</text>
                <text class="field-file__name">{{ formData[field.fieldCode] || field.fileUrl ? '已上传文件' : '暂无文件' }}</text>
              </view>
            </view>

            <!-- JSON/其他类型 -->
            <textarea
              v-else
              v-model="formData[field.fieldCode]"
              class="field-textarea"
              :class="{ 'is-disabled': isFieldDisabled(field) }"
              :disabled="isFieldDisabled(field)"
              :placeholder="`请输入${field.fieldName}`"
              placeholder-class="field-placeholder"
            />
          </view>
        </view>
      </view>

      <!-- 非驳回状态提示 -->
      <view v-if="!isRejected" class="status-notice">
        <view class="status-notice__icon" :style="{ background: getStatusConfig(detail.status).bg, color: getStatusConfig(detail.status).color }">
          {{ detail.status === 'APPROVED' ? '✓' : detail.status === 'PENDING_AUDIT' ? '⏳' : '○' }}
        </view>
        <view class="status-notice__content">
          <view class="status-notice__title">
            {{ detail.statusDesc || getStatusConfig(detail.status).text }}
          </view>
          <view class="status-notice__desc">
            <template v-if="detail.status === 'APPROVED'">
              该核销已通过审核
            </template>
            <template v-else-if="detail.status === 'PENDING_AUDIT'">
              该核销正在审核中，请耐心等待
            </template>
            <template v-else-if="detail.status === 'PENDING_UPLOAD'">
              该核销待上传凭证
            </template>
            <template v-else-if="detail.status === 'CANCELLED'">
              该核销已撤销
            </template>
            <template v-else>
              当前状态：{{ detail.statusDesc }}
            </template>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载失败 -->
    <view v-else class="error-container">
      <view class="error-icon-wrapper">
        <text class="error-icon">!</text>
      </view>
      <text class="error-title">加载失败</text>
      <text class="error-desc">请检查网络后重试</text>
      <view class="retry-btn" @tap="() => recordId && fetchDetail(recordId)">
        重新加载
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="detail && isRejected" class="bottom-bar">
      <view v-if="groupCount > 1" class="progress-steps">
        <view v-for="i in groupCount" :key="i" class="progress-step" :class="{ active: i - 1 <= activeTab, current: i - 1 === activeTab }" />
      </view>
      <view class="bottom-actions">
        <view v-if="groupCount > 1 && !isFirstTab" class="action-btn action-btn--secondary" @tap="prevStep">
          上一步
        </view>
        <view class="action-btn action-btn--primary" @tap="handleBottomAction">
          <text v-if="groupCount === 1 || isLastTab">重新提交</text>
          <text v-else>下一步</text>
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
  padding: 32rpx 24rpx;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #f6f4ee 0%, #f2efe6 22%, #f7f6f1 52%, #fcfbf8 100%);
}

// 背景装饰
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

// 加载状态
.loading-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 300rpx;
}

.loading-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 12rpx 28rpx rgba(48, 38, 24, 0.06);
}

.loading-text {
  font-size: 28rpx;
  color: #6f665b;
}

.content {
  position: relative;
  z-index: 1;
}

// 顶部Hero区
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

.hero-status {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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

// 优惠券卡片
.coupon-card {
  margin-top: 28rpx;
  background: linear-gradient(135deg, #185b4e 0%, #0f3f37 100%);
  border-radius: 32rpx;
  padding: 32rpx;
  color: #fff;
  box-shadow: 0 22rpx 52rpx rgba(9, 30, 28, 0.22);
}

.coupon-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.coupon-type-tag {
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #f7edd1;
}

.coupon-discount {
  font-size: 48rpx;
  font-weight: 800;
  color: #f3ead1;
}

.coupon-card__name {
  font-size: 32rpx;
  font-weight: 600;
  color: #fffdf7;
  margin-bottom: 24rpx;
}

.coupon-card__info {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
  }
}

.info-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.info-value {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
  max-width: 400rpx;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 驳回面板
.reject-panel {
  margin-top: 24rpx;
  padding: 28rpx;
  background: rgba(220, 38, 38, 0.06);
  border: 2rpx solid rgba(220, 38, 38, 0.12);
  border-radius: 28rpx;
}

.reject-panel__head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.reject-panel__icon {
  width: 40rpx;
  height: 40rpx;
  background: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 24rpx;
    color: #fff;
    font-weight: 700;
  }
}

.reject-panel__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #b91c1c;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.issue-item {
  padding: 18rpx 20rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 18rpx;
  border-left: 6rpx solid #dc2626;
}

.issue-item__field {
  font-size: 24rpx;
  font-weight: 600;
  color: #b91c1c;
  margin-bottom: 6rpx;
}

.issue-item__message {
  font-size: 24rpx;
  color: #5f5a52;
  line-height: 1.5;
}

// 审核意见面板
.comment-panel {
  margin-top: 24rpx;
  padding: 28rpx;
  background: rgba(232, 180, 74, 0.1);
  border: 2rpx solid rgba(232, 180, 74, 0.16);
  border-radius: 28rpx;
}

.comment-panel__head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 16rpx;
}

.comment-panel__icon {
  font-size: 28rpx;
}

.comment-panel__title {
  font-size: 28rpx;
  font-weight: 600;
  color: #7c5a10;
}

.comment-panel__content {
  font-size: 26rpx;
  color: #5f5a52;
  line-height: 1.7;
}

// Tab 面板
.tabs-panel {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 10rpx;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 24rpx;
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 10rpx 24rpx rgba(48, 38, 24, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 26rpx;
  color: #6f665b;
  border-radius: 18rpx;
  position: relative;
  transition: all 0.3s ease;

  &.active {
    color: #185b4e;
    font-weight: 600;
    background: rgba(24, 91, 78, 0.08);
  }
}

.tab-indicator {
  position: absolute;
  bottom: 10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: linear-gradient(135deg, #185b4e 0%, #1b6758 100%);
  border-radius: 3rpx;
}

// 表单面板
.form-panel {
  margin-top: 24rpx;
  padding: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  border-radius: 32rpx;
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 14rpx 32rpx rgba(48, 38, 24, 0.07);
}

.form-group-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid rgba(87, 75, 60, 0.08);
}

.form-group__step {
  padding: 8rpx 16rpx;
  background: rgba(24, 91, 78, 0.1);
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #185b4e;
}

.form-group__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1d1a16;
}

.form-section-head {
  margin-bottom: 24rpx;
}

.form-section__kicker {
  font-size: 20rpx;
  color: #8a7f72;
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

.form-section__title {
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: #1d1a16;
}

// 表单字段
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.field-item {
  &.has-issue {
    padding: 20rpx;
    margin: -20rpx;
    background: rgba(220, 38, 38, 0.04);
    border-radius: 20rpx;
    border: 2rpx solid rgba(220, 38, 38, 0.1);
  }
}

.field-issue {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 14rpx;
  padding: 12rpx 16rpx;
  background: rgba(220, 38, 38, 0.08);
  border-radius: 14rpx;
}

.field-issue__icon {
  width: 28rpx;
  height: 28rpx;
  background: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #fff;
  font-weight: 700;
}

.field-issue__text {
  font-size: 24rpx;
  color: #b91c1c;
  font-weight: 500;
}

.field-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.field-label__text {
  font-size: 28rpx;
  color: #1d1a16;
  font-weight: 600;
}

.field-label__required {
  color: #dc2626;
  margin-left: 6rpx;
}

.field-label__badge {
  margin-left: 14rpx;
  padding: 4rpx 14rpx;
  background: #dc2626;
  color: #fff;
  font-size: 20rpx;
  border-radius: 999rpx;
  font-weight: 600;
}

// 输入框
.field-input,
.field-picker,
.field-textarea {
  width: 100%;
  min-height: 88rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #fbfaf7;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  box-sizing: border-box;
  transition: all 0.2s ease;
  color: #1d1a16;

  &:focus {
    border-color: #185b4e;
    background: #fff;
  }

  &.is-disabled {
    background: #f5f2eb;
    color: #9b9388;
    opacity: 0.7;
  }

  &.has-error,
  &.has-value {
    border-color: rgba(24, 91, 78, 0.2);
    background: #fff;
  }

  &.has-error {
    border-color: rgba(220, 38, 38, 0.3);
  }
}

.field-input {
  height: 88rpx;
  line-height: 88rpx;
}

.field-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-textarea {
  min-height: 160rpx;
  padding: 20rpx 24rpx;
}

.field-placeholder {
  color: #a19688;
}

.field-picker__arrow {
  font-size: 32rpx;
  color: #a19688;
  font-weight: 300;
}

.field-error {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #dc2626;
}

// 图片上传
.field-upload {
  position: relative;
}

.upload-box {
  width: 200rpx;
  height: 200rpx;
  background: #fbfaf7;
  border: 2rpx dashed rgba(87, 75, 60, 0.2);
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;

  &.has-image {
    border-style: solid;
    border-color: rgba(24, 91, 78, 0.3);
  }

  &.is-disabled {
    opacity: 0.6;
  }
}

.upload-preview {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-placeholder__icon {
  font-size: 56rpx;
  color: #185b4e;
  font-weight: 300;
}

.upload-placeholder__text {
  font-size: 24rpx;
  color: #6f665b;
  margin-top: 8rpx;
}

.upload-placeholder__ocr {
  font-size: 20rpx;
  color: #7c5a10;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: rgba(232, 180, 74, 0.12);
  border-radius: 999rpx;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
}

// 文件上传
.field-file__card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 20rpx 24rpx;
  background: #fbfaf7;
  border-radius: 16rpx;
  border: 2rpx solid rgba(87, 75, 60, 0.1);

  &.is-disabled {
    opacity: 0.6;
  }
}

.field-file__icon {
  font-size: 28rpx;
}

.field-file__name {
  font-size: 26rpx;
  color: #3f392f;
}

// 状态提示
.status-notice {
  margin-top: 24rpx;
  padding: 28rpx;
  background: rgba(255, 255, 255, 0.78);
  border-radius: 28rpx;
  border: 1rpx solid rgba(87, 75, 60, 0.08);
  box-shadow: 0 14rpx 30rpx rgba(48, 38, 24, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.status-notice__icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex-shrink: 0;
}

.status-notice__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1d1a16;
  margin-bottom: 6rpx;
}

.status-notice__desc {
  font-size: 26rpx;
  color: #6f665b;
  line-height: 1.6;
}

// 错误状态
.error-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 300rpx;
}

.error-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.error-icon {
  font-size: 60rpx;
  color: #dc2626;
  font-weight: 700;
}

.error-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1d1a16;
  margin-bottom: 12rpx;
}

.error-desc {
  font-size: 26rpx;
  color: #6f665b;
  margin-bottom: 40rpx;
}

.retry-btn {
  padding: 20rpx 64rpx;
  background: linear-gradient(135deg, #1b6758 0%, #0f3f37 100%);
  color: #faf7f0;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 14rpx 24rpx rgba(16, 64, 55, 0.2);
}

// 底部操作栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.96);
  padding: 20rpx 32rpx;
  box-shadow: 0 -4rpx 20rpx rgba(48, 38, 24, 0.06);
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.progress-steps {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.progress-step {
  width: 60rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #e5e2db;
  transition: all 0.3s ease;

  &.active {
    background: rgba(24, 91, 78, 0.3);
  }

  &.current {
    width: 80rpx;
    background: linear-gradient(135deg, #185b4e 0%, #1b6758 100%);
  }
}

.bottom-actions {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  flex: 1;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 800;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}

.action-btn--secondary {
  background: #f5f2eb;
  color: #6d655a;
}

.action-btn--primary {
  background: linear-gradient(135deg, #1b6758 0%, #0f3f37 100%);
  color: #faf7f0;
  box-shadow: 0 14rpx 24rpx rgba(16, 64, 55, 0.2);
}

// 响应式
@media (max-width: 680rpx) {
  .hero-title {
    font-size: 52rpx;
  }

  .coupon-discount {
    font-size: 40rpx;
  }
}
</style>
