<script lang="ts" setup>
import type {
  ICouponVerificationDetail,
  ICouponVerificationFormField,
  ICouponVerificationFormGroup,
  ICouponVerificationFormTemplate,
  ICouponVerificationIssue,
} from '@/api/types/coupon-verification'
import {
  getCouponVerificationDetail,
  getCouponVerificationVoucherTemplate,
  resubmitCouponVerification,
  submitCouponVerificationVoucher,
  uploadCouponVerificationFile,
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
const submitting = ref(false)
const recordId = ref<number>()
const mode = ref<'create' | 'detail'>('detail')
const activeTab = ref(0)
const detail = ref<ICouponVerificationDetail | null>(null)
const formTemplate = ref<ICouponVerificationFormTemplate | null>(null)
const formData = ref<Record<string, any>>({})
const fieldErrors = ref<Record<string, string>>({})
const fieldExtraInfo = ref<Record<string, FieldExtraInfo>>({})
const uploadingFields = ref<Set<string>>(new Set())
const issueMap = ref<Map<string, ICouponVerificationIssue>>(new Map())

const statusMap: Record<string, { text: string, color: string, bg: string }> = {
  PENDING_VOUCHER: { text: '待上传凭证', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  PENDING_REVIEW: { text: '待审核', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  REJECTED: { text: '已驳回', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  APPROVED: { text: '已通过', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
}

const sourceGroups = computed<ICouponVerificationFormGroup[]>(() => {
  if (mode.value === 'create') {
    return formTemplate.value?.groups || []
  }
  return detail.value?.currentSubmission?.groups || []
})

const groupCount = computed(() => sourceGroups.value.length)
const currentGroup = computed(() => sourceGroups.value[activeTab.value])
const isFirstTab = computed(() => activeTab.value === 0)
const isLastTab = computed(() => activeTab.value === groupCount.value - 1)
const issues = computed(() => detail.value?.currentSubmission?.issues || [])
const isRejected = computed(() => detail.value?.currentStatus === 'REJECTED')
const canEdit = computed(() => mode.value === 'create' || isRejected.value)

function getStatusMeta(status?: string) {
  if (!status) {
    return { text: '--', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }
  }
  return statusMap[status] || { text: status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }
}

function parseEnumOptions(options: string | null) {
  if (!options) {
    return []
  }
  try {
    return JSON.parse(options)
  }
  catch {
    return options.split(',').map(item => item.trim()).filter(Boolean)
  }
}

function parseValidationRule(rule: string | null): Record<string, any> {
  if (!rule) {
    return {}
  }
  try {
    return JSON.parse(rule)
  }
  catch {
    return {}
  }
}

function initFormData(groups: ICouponVerificationFormGroup[]) {
  const nextFormData: Record<string, any> = {}
  const nextExtraInfo: Record<string, FieldExtraInfo> = {}

  groups.forEach((group) => {
    group.fields.forEach((field) => {
      nextFormData[field.fieldCode] = field.value || ''
      if (field.fileId) {
        nextExtraInfo[field.fieldCode] = {
          fileId: field.fileId,
        }
      }
    })
  })

  formData.value = nextFormData
  fieldExtraInfo.value = nextExtraInfo
}

function buildIssueMap() {
  issueMap.value.clear()
  issues.value.forEach((issue) => {
    issueMap.value.set(issue.fieldCode, issue)
  })
}

function hasIssue(fieldCode: string) {
  return issueMap.value.has(fieldCode)
}

function getIssue(fieldCode: string) {
  return issueMap.value.get(fieldCode)
}

function isFieldDisabled(field: ICouponVerificationFormField) {
  if (!canEdit.value) {
    return true
  }
  if (field.isCalculated === 1) {
    return true
  }
  if (field.isUserEditable === 0) {
    return true
  }
  return false
}

function validateField(field: ICouponVerificationFormField, value: any) {
  if (!value) {
    return null
  }

  const rule = parseValidationRule(field.validationRule)
  if (!rule || Object.keys(rule).length === 0) {
    return null
  }

  const text = String(value)
  const regexPattern = rule.regex || rule.pattern
  if (regexPattern) {
    try {
      const regex = new RegExp(regexPattern)
      if (!regex.test(text)) {
        return rule.message || `${field.fieldName}格式不正确`
      }
    }
    catch (error) {
      console.warn('校验规则异常:', error)
    }
  }

  return null
}

function clearFieldState(fieldCode: string) {
  delete fieldErrors.value[fieldCode]
  issueMap.value.delete(fieldCode)
}

function handleFieldBlur(field: ICouponVerificationFormField) {
  const error = validateField(field, formData.value[field.fieldCode])
  if (error) {
    fieldErrors.value[field.fieldCode] = error
    return
  }
  clearFieldState(field.fieldCode)
}

function handlePickerChange(field: ICouponVerificationFormField, value: string) {
  formData.value[field.fieldCode] = value
  clearFieldState(field.fieldCode)
}

function fillOcrResult(ocrResult: Record<string, string>, fileId: number) {
  const allFields = sourceGroups.value.flatMap(group => group.fields)

  Object.entries(ocrResult).forEach(([key, value]) => {
    const targetField = allFields.find(field => field.fieldName === key)
    if (!targetField || !value || isFieldDisabled(targetField)) {
      return
    }

    formData.value[targetField.fieldCode] = value
    fieldExtraInfo.value[targetField.fieldCode] = {
      ...fieldExtraInfo.value[targetField.fieldCode],
      fileId,
      ocrAutofill: 1,
    }
    clearFieldState(targetField.fieldCode)
  })
}

async function uploadByField(field: ICouponVerificationFormField, fileType: 'image' | 'file') {
  if (uploadingFields.value.has(field.fieldCode) || isFieldDisabled(field)) {
    return
  }

  const chooseOptions = fileType === 'image'
    ? {
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      }
    : { count: 1 }

  const chooseHandler = fileType === 'image' ? uni.chooseImage : uni.chooseFile

  chooseHandler({
    ...(chooseOptions as any),
    success: async (res: any) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) {
        uni.showToast({ title: '未获取到文件', icon: 'none' })
        return
      }

      try {
        uploadingFields.value.add(field.fieldCode)
        const uploadRes = await uploadCouponVerificationFile(filePath, {
          needOcr: fileType === 'image' && field.ocrEnabled === 1,
          ocrMappingKey: field.ocrMappingKey,
        })

        formData.value[field.fieldCode] = uploadRes.url
        fieldExtraInfo.value[field.fieldCode] = {
          ...fieldExtraInfo.value[field.fieldCode],
          fileId: uploadRes.verificationFileId,
        }
        clearFieldState(field.fieldCode)

        if (uploadRes.ocrResult && Object.keys(uploadRes.ocrResult).length > 0) {
          fillOcrResult(uploadRes.ocrResult, uploadRes.verificationFileId)
        }

        uni.showToast({ title: '上传成功', icon: 'success' })
      }
      catch (error: any) {
        console.error('上传失败:', error)
        uni.showToast({ title: error?.message || '上传失败', icon: 'none' })
      }
      finally {
        uploadingFields.value.delete(field.fieldCode)
      }
    },
    fail: (error: any) => {
      if (error?.errMsg?.includes('cancel')) {
        return
      }
      uni.showToast({ title: '选择文件失败', icon: 'none' })
    },
  })
}

function normalizeFieldValues() {
  const allFields = sourceGroups.value.flatMap(group => group.fields)

  for (const field of allFields) {
    const value = formData.value[field.fieldCode]

    if (field.isRequired === 1 && !value) {
      uni.showToast({ title: `请填写${field.fieldName}`, icon: 'none' })
      return null
    }

    const validationError = validateField(field, value)
    if (validationError) {
      uni.showToast({ title: validationError, icon: 'none' })
      return null
    }
  }

  if (isRejected.value && issueMap.value.size > 0) {
    uni.showToast({ title: '请先处理所有驳回项', icon: 'none' })
    return null
  }

  return allFields.map((field) => {
    const payload: Record<string, any> = {
      fieldCode: field.fieldCode,
      value: formData.value[field.fieldCode],
    }

    const extraInfo = fieldExtraInfo.value[field.fieldCode]
    if (extraInfo?.fileId) {
      payload.fileId = extraInfo.fileId
    }
    if (extraInfo?.ocrAutofill) {
      payload.ocrAutofill = 1
    }

    return payload
  })
}

async function submitCurrentForm() {
  if (!recordId.value || submitting.value) {
    return
  }

  const fieldValues = normalizeFieldValues()
  if (!fieldValues) {
    return
  }

  try {
    submitting.value = true
    uni.showLoading({ title: '提交中...' })

    if (mode.value === 'create') {
      await submitCouponVerificationVoucher(recordId.value, { fieldValues })
    }
    else {
      await resubmitCouponVerification(recordId.value, { fieldValues })
    }

    uni.hideLoading()
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1200)
  }
  catch (error) {
    uni.hideLoading()
    console.error('提交失败:', error)
    uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
  }
  finally {
    submitting.value = false
  }
}

function switchTab(index: number) {
  if (index >= 0 && index < groupCount.value) {
    activeTab.value = index
  }
}

function prevStep() {
  if (activeTab.value > 0) {
    activeTab.value -= 1
  }
}

function handleBottomAction() {
  if (!isLastTab.value && groupCount.value > 1) {
    activeTab.value += 1
    return
  }

  submitCurrentForm()
}

async function loadCreateData(id: number) {
  const [detailRes, templateRes] = await Promise.allSettled([
    getCouponVerificationDetail<ICouponVerificationDetail>(id),
    getCouponVerificationVoucherTemplate<ICouponVerificationFormTemplate>(id),
  ])

  if (detailRes.status === 'fulfilled') {
    detail.value = detailRes.value
    buildIssueMap()
  }

  if (templateRes.status === 'fulfilled') {
    formTemplate.value = templateRes.value
    initFormData(templateRes.value.groups || [])
    return
  }

  throw templateRes.reason
}

async function loadDetailData(id: number) {
  detail.value = await getCouponVerificationDetail<ICouponVerificationDetail>(id)
  initFormData(detail.value.currentSubmission?.groups || [])
  buildIssueMap()
}

async function fetchPageData(id: number) {
  try {
    loading.value = true
    activeTab.value = 0
    fieldErrors.value = {}
    issueMap.value.clear()

    if (mode.value === 'create') {
      await loadCreateData(id)
    }
    else {
      await loadDetailData(id)
    }
  }
  catch (error) {
    console.error('获取核销详情失败:', error)
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((query: Record<string, any>) => {
  const id = Number(query.id)
  if (!id) {
    uni.showToast({ title: '缺少记录参数', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
    return
  }

  recordId.value = id
  mode.value = query.mode === 'create' ? 'create' : 'detail'
  fetchPageData(id)
})
</script>

<template>
  <view class="page-container">
    <view v-if="loading" class="loading-container">
      <wd-loading size="40px" />
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else class="content">
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">核销单号</text>
          <text class="info-value">{{ detail?.verificationNo || `记录 ${recordId}` }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">活动名称</text>
          <text class="info-value highlight">{{ detail?.activityName || formTemplate?.activityName || '--' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">券名称</text>
          <text class="info-value">{{ detail?.couponTitle || '--' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">当前状态</text>
          <view
            class="status-tag"
            :style="{ color: getStatusMeta(detail?.currentStatus).color, background: getStatusMeta(detail?.currentStatus).bg }"
          >
            {{ mode === 'create' && !detail?.currentStatus ? '待提交凭证' : getStatusMeta(detail?.currentStatus).text }}
          </view>
        </view>
      </view>

      <view v-if="isRejected && issues.length > 0" class="reject-notice">
        <view class="reject-title">
          审核已驳回，请先修改以下问题
        </view>
        <view v-for="item in issues" :key="item.id" class="reject-item">
          <text class="reject-field">{{ item.fieldName }}</text>
          <text class="reject-message">{{ item.issueMessage }}</text>
        </view>
      </view>

      <view v-if="groupCount > 1" class="tabs-container">
        <view
          v-for="(group, index) in sourceGroups"
          :key="`${group.groupName}-${index}`"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @tap="switchTab(index)"
        >
          {{ group.groupName }}
        </view>
      </view>

      <view v-if="currentGroup" class="form-card">
        <view v-if="groupCount > 1" class="group-title">
          {{ currentGroup.groupName }}
        </view>

        <view class="field-list">
          <view
            v-for="field in currentGroup.fields"
            :key="field.fieldId"
            class="field-item"
            :class="{ issue: hasIssue(field.fieldCode) }"
          >
            <view v-if="hasIssue(field.fieldCode)" class="issue-tip">
              {{ getIssue(field.fieldCode)?.issueMessage }}
            </view>

            <view class="field-label">
              <text>{{ field.fieldName }}</text>
              <text v-if="field.isRequired === 1" class="required-mark">*</text>
            </view>

            <input
              v-if="['text', 'number', 'phone', 'money'].includes(field.fieldType)"
              v-model="formData[field.fieldCode]"
              class="field-input"
              :class="{ disabled: isFieldDisabled(field), error: fieldErrors[field.fieldCode] || hasIssue(field.fieldCode) }"
              :disabled="isFieldDisabled(field)"
              :type="field.fieldType === 'money' ? 'digit' : field.fieldType === 'text' ? 'text' : 'number'"
              :placeholder="`请输入${field.fieldName}`"
              placeholder-class="input-placeholder"
              @blur="handleFieldBlur(field)"
            >

            <picker
              v-else-if="field.fieldType === 'date'"
              mode="date"
              :value="formData[field.fieldCode] || ''"
              @change="(e: any) => handlePickerChange(field, e.detail.value)"
            >
              <view class="field-picker" :class="{ disabled: isFieldDisabled(field), active: formData[field.fieldCode] }">
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="picker-placeholder">请选择{{ field.fieldName }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>

            <picker
              v-else-if="field.fieldType === 'enum'"
              mode="selector"
              :range="parseEnumOptions(field.enumOptions)"
              :value="Math.max(parseEnumOptions(field.enumOptions).indexOf(formData[field.fieldCode]), 0)"
              @change="(e: any) => handlePickerChange(field, parseEnumOptions(field.enumOptions)[e.detail.value])"
            >
              <view class="field-picker" :class="{ disabled: isFieldDisabled(field), active: formData[field.fieldCode] }">
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="picker-placeholder">请选择{{ field.fieldName }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>

            <view v-else-if="field.fieldType === 'image'" class="upload-wrapper">
              <view
                class="upload-box"
                :class="{ disabled: isFieldDisabled(field), active: formData[field.fieldCode], error: hasIssue(field.fieldCode) }"
                @tap="uploadByField(field, 'image')"
              >
                <image
                  v-if="formData[field.fieldCode]"
                  :src="formData[field.fieldCode]"
                  class="preview-image"
                  mode="aspectFill"
                />
                <view v-else class="upload-placeholder">
                  <text class="upload-icon">+</text>
                  <text class="upload-text">上传图片</text>
                </view>
              </view>
              <view v-if="uploadingFields.has(field.fieldCode)" class="upload-mask">
                <wd-loading size="22px" />
              </view>
            </view>

            <view v-else-if="field.fieldType === 'file'" class="file-upload" @tap="uploadByField(field, 'file')">
              <view class="field-picker" :class="{ disabled: isFieldDisabled(field), active: formData[field.fieldCode] }">
                <text class="file-text">{{ formData[field.fieldCode] ? '已上传文件，点击重新上传' : '点击上传文件' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </view>

            <textarea
              v-else
              v-model="formData[field.fieldCode]"
              class="field-textarea"
              :class="{ disabled: isFieldDisabled(field), error: hasIssue(field.fieldCode) }"
              :disabled="isFieldDisabled(field)"
              :placeholder="`请输入${field.fieldName}`"
              placeholder-class="input-placeholder"
              @blur="handleFieldBlur(field)"
            />

            <text v-if="fieldErrors[field.fieldCode]" class="error-text">{{ fieldErrors[field.fieldCode] }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-tip">
        暂无可展示的凭证信息
      </view>
    </view>

    <view v-if="canEdit && currentGroup" class="bottom-bar">
      <view v-if="groupCount > 1" class="bottom-progress">
        <view v-for="i in groupCount" :key="i" class="progress-dot" :class="{ active: i - 1 <= activeTab }" />
      </view>

      <view class="bottom-actions">
        <view v-if="groupCount > 1 && !isFirstTab" class="action-btn secondary" @tap="prevStep">
          上一步
        </view>
        <view class="action-btn primary" @tap="handleBottomAction">
          {{ isLastTab || groupCount === 1 ? (mode === 'create' ? '提交凭证' : '重新提交') : '下一步' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding-bottom: 220rpx;
  background: linear-gradient(180deg, #f6fbf7 0%, #ffffff 38%, #ffffff 100%);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 240rpx;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #64748b;
}

.content {
  padding: 32rpx 28rpx 40rpx;
}

.info-card,
.reject-notice,
.tabs-container,
.form-card,
.empty-tip {
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.06);
}

.info-card {
  padding: 28rpx 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;

  &:not(:first-child) {
    margin-top: 18rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid #f1f5f9;
  }
}

.info-label {
  font-size: 24rpx;
  color: #94a3b8;
}

.info-value {
  max-width: 70%;
  font-size: 24rpx;
  color: #334155;
  text-align: right;

  &.highlight {
    color: #16a34a;
    font-weight: 600;
  }
}

.status-tag {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.reject-notice {
  margin-top: 24rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
}

.reject-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #dc2626;
}

.reject-item {
  margin-top: 14rpx;
  padding: 16rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.7);
}

.reject-field {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: #dc2626;
}

.reject-message {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #7f1d1d;
}

.tabs-container {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 10rpx;
}

.tab-item {
  flex: 1;
  min-width: 0;
  padding: 18rpx 12rpx;
  border-radius: 20rpx;
  text-align: center;
  font-size: 24rpx;
  color: #64748b;

  &.active {
    background: rgba(22, 163, 74, 0.12);
    color: #166534;
    font-weight: 700;
  }
}

.form-card {
  margin-top: 24rpx;
  padding: 28rpx 24rpx;
}

.group-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.field-list {
  margin-top: 8rpx;
}

.field-item {
  margin-top: 24rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f8fafc;

  &.issue {
    background: #fff7ed;
    border: 2rpx solid rgba(220, 38, 38, 0.14);
  }
}

.issue-tip {
  margin-bottom: 12rpx;
  padding: 10rpx 14rpx;
  border-radius: 14rpx;
  background: rgba(220, 38, 38, 0.1);
  font-size: 23rpx;
  line-height: 1.6;
  color: #b91c1c;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 12rpx;
  font-size: 27rpx;
  font-weight: 600;
  color: #111827;
}

.required-mark {
  color: #dc2626;
}

.field-input,
.field-picker,
.field-textarea {
  width: 100%;
  min-height: 88rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: #fff;
  border: 2rpx solid transparent;
  box-sizing: border-box;
  font-size: 27rpx;
  color: #334155;
}

.field-input {
  height: 88rpx;
  line-height: 88rpx;
}

.field-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.active {
    border-color: rgba(22, 163, 74, 0.2);
  }
}

.field-textarea {
  min-height: 180rpx;
  padding: 20rpx 22rpx;
}

.field-input.disabled,
.field-picker.disabled,
.field-textarea.disabled {
  background: #f1f5f9;
  color: #94a3b8;
}

.field-input.error,
.field-textarea.error,
.upload-box.error {
  border-color: rgba(220, 38, 38, 0.4);
}

.input-placeholder,
.picker-placeholder {
  color: #94a3b8;
}

.picker-arrow {
  font-size: 28rpx;
  color: #94a3b8;
}

.upload-wrapper {
  position: relative;
}

.upload-box {
  width: 220rpx;
  height: 220rpx;
  border-radius: 20rpx;
  border: 2rpx dashed rgba(148, 163, 184, 0.4);
  background: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &.disabled {
    opacity: 0.7;
  }

  &.active {
    border-style: solid;
    border-color: rgba(22, 163, 74, 0.3);
  }
}

.preview-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
}

.upload-icon {
  font-size: 56rpx;
  color: #16a34a;
}

.upload-text {
  margin-top: 6rpx;
  font-size: 24rpx;
}

.upload-mask {
  position: absolute;
  inset: 0 auto auto 0;
  width: 220rpx;
  height: 220rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-text {
  color: #334155;
}

.error-text {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #dc2626;
}

.empty-tip {
  margin-top: 24rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #64748b;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8rpx 24rpx rgba(15, 23, 42, 0.06);
}

.bottom-progress {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.progress-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d1d5db;

  &.active {
    width: 32rpx;
    border-radius: 999rpx;
    background: #16a34a;
  }
}

.bottom-actions {
  display: flex;
  gap: 18rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 29rpx;
  font-weight: 700;

  &.primary {
    background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
    color: #fff;
  }

  &.secondary {
    background: #f1f5f9;
    color: #475569;
  }
}
</style>
