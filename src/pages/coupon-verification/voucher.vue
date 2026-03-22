<script lang="ts" setup>
import type { ICouponWriteOffFormField, ICouponWriteOffFormTemplate } from '@/api/types/coupon-verification'
import { getWriteOffFormTemplate, submitWriteOffVoucher, uploadWriteOffFile } from '@/api/coupon-verification'

defineOptions({
  name: 'CouponVerificationVoucher',
})

definePage({
  style: {
    navigationBarTitleText: '上传凭证',
  },
})

// 获取路由参数
const recordId = ref<number>(0)
const templateId = ref<number>(0)

// 状态
const loading = ref(true)
const submitting = ref(false)
const formTemplate = ref<ICouponWriteOffFormTemplate | null>(null)
const activeTab = ref(0)
const formData = ref<Record<string, any>>({})
const uploadingFields = ref<Set<string>>(new Set())

// 字段额外信息（用于提交）
interface FieldExtraInfo {
  fileId?: number
  ocrAutofill?: 1
}
const fieldExtraInfo = ref<Record<string, FieldExtraInfo>>({})

// 字段校验错误信息
const fieldErrors = ref<Record<string, string>>({})

// 计算属性
const groupCount = computed(() => formTemplate.value?.groups?.length || 0)
const currentGroup = computed(() => formTemplate.value?.groups?.[activeTab.value])
const isFirstTab = computed(() => activeTab.value === 0)
const isLastTab = computed(() => activeTab.value === groupCount.value - 1)

// 获取表单模板
async function fetchFormTemplate() {
  if (!templateId.value)
    return

  try {
    loading.value = true
    const res = await getWriteOffFormTemplate(templateId.value)
    formTemplate.value = res
  }
  catch (error) {
    console.error('获取表单模板失败:', error)
    uni.showToast({ title: '获取表单失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

// 切换 Tab
function switchTab(index: number) {
  if (index >= 0 && index < groupCount.value) {
    activeTab.value = index
  }
}

// 上一步
function prevStep() {
  if (activeTab.value > 0) {
    activeTab.value--
  }
}

// 下一步
function nextStep() {
  if (activeTab.value < groupCount.value - 1) {
    activeTab.value++
  }
}

// 解析枚举选项
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

// 解析校验规则
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

// 校验单个字段
function validateField(field: ICouponWriteOffFormField, value: any): string | null {
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

// 字段失焦时校验
function handleFieldBlur(field: ICouponWriteOffFormField) {
  const value = formData.value[field.fieldCode]
  const error = validateField(field, value)
  if (error) {
    fieldErrors.value[field.fieldCode] = error
  }
  else {
    delete fieldErrors.value[field.fieldCode]
  }
}

// 字段是否禁用
function isFieldDisabled(field: ICouponWriteOffFormField): boolean {
  return field.isEditable === 0
}

// 上传图片
async function uploadImage(field: ICouponWriteOffFormField) {
  if (uploadingFields.value.has(field.fieldCode))
    return

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uploadingFields.value.add(field.fieldCode)

      uploadWriteOffFile(tempFilePath, {
        needOcr: field.ocrEnabled === 1,
        ocrMappingKey: field.ocrMappingKey,
      })
        .then((uploadRes) => {
          formData.value[field.fieldCode] = uploadRes.url
          fieldExtraInfo.value[field.fieldCode] = {
            ...fieldExtraInfo.value[field.fieldCode],
            fileId: uploadRes.fileId,
          }

          if (uploadRes.ocrResult && Object.keys(uploadRes.ocrResult).length > 0) {
            fillOcrResult(uploadRes.ocrResult, uploadRes.fileId)
            uni.showToast({ title: '上传成功并识别', icon: 'success' })
          }
          else {
            uni.showToast({ title: '上传成功', icon: 'success' })
          }
        })
        .catch((error) => {
          console.error('上传失败:', error)
          uni.showToast({ title: error.message || '上传失败', icon: 'none' })
        })
        .finally(() => {
          uploadingFields.value.delete(field.fieldCode)
        })
    },
    fail: () => {
      uni.showToast({ title: '取消选择', icon: 'none' })
    },
  })
}

// 根据 OCR 结果填充表单字段
function fillOcrResult(ocrResult: Record<string, string>, fileId: number) {
  const allFields = formTemplate.value?.groups?.flatMap(g => g.fields) || []

  Object.entries(ocrResult).forEach(([key, value]) => {
    const targetField = allFields.find(f => f.fieldName === key)
    if (targetField && value && targetField.isEditable === 1) {
      formData.value[targetField.fieldCode] = value
      if (!fieldExtraInfo.value[targetField.fieldCode]) {
        fieldExtraInfo.value[targetField.fieldCode] = {}
      }
      fieldExtraInfo.value[targetField.fieldCode].fileId = fileId
      fieldExtraInfo.value[targetField.fieldCode].ocrAutofill = 1
      delete fieldErrors.value[targetField.fieldCode]
    }
  })
}

// 上传文件
async function uploadFile(field: ICouponWriteOffFormField) {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '*/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file)
      return

    uploadingFields.value.add(field.fieldCode)
    try {
      const tempFilePath = URL.createObjectURL(file)
      const uploadRes = await uploadWriteOffFile(tempFilePath, { needOcr: false })
      formData.value[field.fieldCode] = uploadRes.url
      fieldExtraInfo.value[field.fieldCode] = { fileId: uploadRes.fileId }
      uni.showToast({ title: '上传成功', icon: 'success' })
    }
    catch (error) {
      console.error('上传失败:', error)
      uni.showToast({ title: '上传失败', icon: 'none' })
    }
    finally {
      uploadingFields.value.delete(field.fieldCode)
    }
  }
  input.click()
  // #endif

  // #ifndef H5
  uni.chooseFile({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uploadingFields.value.add(field.fieldCode)

      try {
        const uploadRes = await uploadWriteOffFile(tempFilePath, { needOcr: false })
        formData.value[field.fieldCode] = uploadRes.url
        fieldExtraInfo.value[field.fieldCode] = { fileId: uploadRes.fileId }
        uni.showToast({ title: '上传成功', icon: 'success' })
      }
      catch (error) {
        console.error('上传失败:', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
      finally {
        uploadingFields.value.delete(field.fieldCode)
      }
    },
    fail: () => {
      uni.showToast({ title: '取消选择', icon: 'none' })
    },
  })
  // #endif
}

// 提交表单
async function submitForm() {
  if (Object.keys(fieldErrors.value).length > 0) {
    uni.showToast({ title: '请修正表单中的错误', icon: 'none' })
    return
  }

  const allFields = formTemplate.value?.groups?.flatMap(g => g.fields) || []
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
      valueSeq?: number
      value: any
      fileId?: number
      ocrAutofill?: 0 | 1
    } = {
      fieldCode: field.fieldCode,
      value,
      valueSeq: 1,
    }

    if (extraInfo.fileId) {
      fieldValue.fileId = extraInfo.fileId
    }

    if (extraInfo.ocrAutofill) {
      fieldValue.ocrAutofill = 1
    }

    return fieldValue
  })

  try {
    submitting.value = true
    await submitWriteOffVoucher(recordId.value, { fieldValues, remark: '' })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/coupon-verification/records' })
    }, 1500)
  }
  catch (error) {
    console.error('提交失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
  finally {
    submitting.value = false
  }
}

// 处理底部按钮点击
function handleBottomAction() {
  if (groupCount.value === 1) {
    submitForm()
  }
  else if (isLastTab.value) {
    submitForm()
  }
  else {
    nextStep()
  }
}

// 页面加载
onLoad((query) => {
  recordId.value = Number(query?.recordId) || 0
  templateId.value = Number(query?.templateId) || 0
  if (templateId.value) {
    fetchFormTemplate()
  }
  else {
    uni.showToast({ title: '缺少模板参数', icon: 'none' })
    loading.value = false
  }
})
</script>

<template>
  <view class="page-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="bg-circle bg-circle-1" />
      <view class="bg-circle bg-circle-2" />
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-icon-wrapper">
        <wd-loading size="40px" />
      </view>
      <text class="loading-text">加载表单中...</text>
    </view>

    <!-- 表单内容 -->
    <view v-else-if="formTemplate" class="form-content">
      <!-- 页面标题 -->
      <view class="page-header">
        <text class="page-title">{{ formTemplate.templateName || '上传凭证' }}</text>
        <text class="page-subtitle">{{ formTemplate.activityName }}</text>
      </view>

      <!-- 多个分组时显示 Tab -->
      <view v-if="groupCount > 1" class="tabs-container">
        <view
          v-for="(group, index) in formTemplate.groups"
          :key="index"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @tap="switchTab(index)"
        >
          <text class="tab-text">{{ group.groupName }}</text>
          <view v-if="activeTab === index" class="tab-indicator" />
        </view>
      </view>

      <!-- 表单字段卡片 -->
      <view class="form-card">
        <!-- 当前分组的标题 -->
        <view v-if="groupCount > 1" class="group-header">
          <view class="group-icon">
            <text>{{ activeTab + 1 }}</text>
          </view>
          <text class="group-title">{{ currentGroup?.groupName }}</text>
        </view>

        <!-- 表单字段 -->
        <view class="form-fields">
          <view v-for="field in currentGroup?.fields" :key="field.fieldId" class="form-item">
            <!-- 标签 -->
            <view class="field-label">
              <text class="label-text">{{ field.fieldName }}</text>
              <text v-if="field.isRequired === 1" class="required-mark">*</text>
            </view>

            <!-- 文本输入 -->
            <template v-if="field.fieldType === 'text'">
              <input
                v-model="formData[field.fieldCode]"
                class="field-input"
                :class="{ disabled: isFieldDisabled(field), error: fieldErrors[field.fieldCode] }"
                :disabled="isFieldDisabled(field)"
                :placeholder="`请输入${field.fieldName}`"
                placeholder-class="input-placeholder"
                @blur="handleFieldBlur(field)"
              >
              <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
            </template>

            <!-- 数字输入 -->
            <template v-else-if="field.fieldType === 'number'">
              <input
                v-model="formData[field.fieldCode]"
                type="number"
                class="field-input"
                :class="{ disabled: isFieldDisabled(field), error: fieldErrors[field.fieldCode] }"
                :disabled="isFieldDisabled(field)"
                :placeholder="`请输入${field.fieldName}`"
                placeholder-class="input-placeholder"
                @blur="handleFieldBlur(field)"
              >
              <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
            </template>

            <!-- 日期选择 -->
            <picker
              v-else-if="field.fieldType === 'date'"
              mode="date"
              :value="formData[field.fieldCode] || ''"
              @change="(e) => formData[field.fieldCode] = e.detail.value"
            >
              <view class="field-picker" :class="{ disabled: isFieldDisabled(field), hasValue: formData[field.fieldCode] }">
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="placeholder">请选择{{ field.fieldName }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>

            <!-- 枚举选择 -->
            <picker
              v-else-if="field.fieldType === 'enum'"
              mode="selector"
              :range="parseEnumOptions(field.enumOptions)"
              :value="parseEnumOptions(field.enumOptions).indexOf(formData[field.fieldCode])"
              @change="(e) => formData[field.fieldCode] = parseEnumOptions(field.enumOptions)[e.detail.value]"
            >
              <view class="field-picker" :class="{ disabled: isFieldDisabled(field), hasValue: formData[field.fieldCode] }">
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="placeholder">请选择{{ field.fieldName }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>

            <!-- 图片上传 -->
            <view v-else-if="field.fieldType === 'image'" class="upload-container">
              <view
                class="upload-box"
                :class="{ disabled: isFieldDisabled(field), hasImage: formData[field.fieldCode] }"
                @tap="!isFieldDisabled(field) && uploadImage(field)"
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
                  <text v-if="field.ocrEnabled === 1" class="ocr-tip">支持OCR识别</text>
                </view>
              </view>
              <view v-if="uploadingFields.has(field.fieldCode)" class="uploading-mask">
                <wd-loading size="24px" />
              </view>
            </view>

            <!-- 文件上传 -->
            <view v-else-if="field.fieldType === 'file'" class="upload-container file-upload">
              <view
                class="file-upload-box"
                :class="{ disabled: isFieldDisabled(field), hasFile: formData[field.fieldCode] }"
                @tap="!isFieldDisabled(field) && uploadFile(field)"
              >
                <text class="file-icon">📄</text>
                <text v-if="formData[field.fieldCode]" class="file-name">{{ formData[field.fieldCode] }}</text>
                <text v-else class="placeholder">点击上传文件</text>
              </view>
            </view>

            <!-- JSON 输入（暂时用文本域） -->
            <textarea
              v-else-if="field.fieldType === 'json'"
              v-model="formData[field.fieldCode]"
              class="field-textarea"
              :class="{ disabled: isFieldDisabled(field) }"
              :disabled="isFieldDisabled(field)"
              :placeholder="`请输入${field.fieldName}`"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="bottom-actions">
        <!-- 进度指示器 -->
        <view v-if="groupCount > 1" class="progress-indicator">
          <view v-for="i in groupCount" :key="i" class="progress-dot" :class="{ active: i - 1 <= activeTab }" />
        </view>

        <view class="action-buttons">
          <!-- 上一步按钮 -->
          <view v-if="groupCount > 1 && !isFirstTab" class="action-btn prev-btn" @tap="prevStep">
            上一步
          </view>

          <!-- 提交/下一步按钮 -->
          <view class="action-btn next-btn" :class="{ disabled: submitting }" @tap="handleBottomAction">
            <text v-if="groupCount === 1">提交凭证</text>
            <text v-else-if="isLastTab">提交凭证</text>
            <text v-else>下一步</text>
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
      <view class="retry-btn" @tap="fetchFormTemplate">
        重新加载
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f4ee 0%, #f2efe6 22%, #f7f6f1 52%, #fcfbf8 100%);
  padding-bottom: 200rpx;
  position: relative;
  overflow: hidden;
}

// 背景装饰圆
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
}

.bg-circle-1 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, #e8b44a 0%, #fbb97d 100%);
  top: -100rpx;
  right: -50rpx;
  filter: blur(60rpx);
}

.bg-circle-2 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #185b4e 0%, #2d8a78 100%);
  top: 100rpx;
  left: -80rpx;
  filter: blur(50rpx);
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 300rpx;
}

.loading-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #f6f4ee 0%, #e8dcc8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.loading-text {
  color: #64748b;
  font-size: 28rpx;
}

// 错误状态
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 300rpx;
}

.error-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #fff2f0 0%, #ffe4e0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.error-icon {
  font-size: 60rpx;
  color: #dc2626;
  font-weight: bold;
}

.error-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1d1a16;
  margin-bottom: 12rpx;
}

.error-desc {
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 40rpx;
}

.retry-btn {
  padding: 20rpx 64rpx;
  background: linear-gradient(135deg, #185b4e 0%, #2d8a78 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 8rpx 24rpx rgba(24, 91, 78, 0.3);
}

// 表单内容
.form-content {
  padding: 32rpx;
  position: relative;
  z-index: 1;
}

// 页面标题
.page-header {
  margin-bottom: 32rpx;
  text-align: center;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1d1a16;
  margin-bottom: 8rpx;
}

.page-subtitle {
  font-size: 26rpx;
  color: #64748b;
}

// Tab 样式
.tabs-container {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow:
    0 2rpx 8rpx rgba(48, 38, 24, 0.06),
    0 8rpx 24rpx rgba(48, 38, 24, 0.08);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #5f5a52;
  border-radius: 12rpx;
  position: relative;
  transition: all 0.3s ease;

  &.active {
    color: #185b4e;
    font-weight: 600;
    background: rgba(24, 91, 78, 0.1);
  }
}

.tab-text {
  position: relative;
  z-index: 1;
}

.tab-indicator {
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: linear-gradient(135deg, #185b4e 0%, #2d8a78 100%);
  border-radius: 3rpx;
}

// 表单卡片
.form-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow:
    0 2rpx 8rpx rgba(48, 38, 24, 0.06),
    0 8rpx 24rpx rgba(48, 38, 24, 0.08);
}

// 分组标题
.group-header {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background: linear-gradient(135deg, #f8f6f1 0%, #f0ebe0 100%);
  border-bottom: 1rpx solid rgba(87, 75, 60, 0.1);
}

.group-icon {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #185b4e 0%, #2d8a78 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;

  text {
    font-size: 24rpx;
    color: #fff;
    font-weight: 600;
  }
}

.group-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1d1a16;
}

// 表单字段样式
.form-fields {
  padding: 24rpx;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.field-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.label-text {
  font-size: 28rpx;
  color: #1d1a16;
  font-weight: 500;
}

.required-mark {
  color: #dc2626;
  margin-left: 8rpx;
}

.field-input,
.field-picker,
.field-textarea {
  width: 100%;
  min-height: 88rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #f8f6f1;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:focus {
    border-color: #185b4e;
    background: #fff;
  }
}

.input-placeholder {
  color: #a8a095;
}

.field-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  &.hasValue {
    background: #fff;
    border-color: #185b4e;
  }
}

.picker-arrow {
  font-size: 32rpx;
  color: #a8a095;
  font-weight: 300;
}

.field-input.error {
  border-color: #dc2626;
  background: #fff;
}

.field-error {
  font-size: 24rpx;
  color: #dc2626;
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}

.field-input.disabled,
.field-picker.disabled {
  background: #f0ebe0;
  color: #7a7267;
  opacity: 0.7;
}

.field-textarea {
  min-height: 160rpx;
  padding: 20rpx 24rpx;
}

.placeholder {
  color: #a8a095;
}

// 上传样式
.upload-container {
  position: relative;
}

.upload-box {
  width: 200rpx;
  height: 200rpx;
  background: #f8f6f1;
  border: 2rpx dashed #d4cfc4;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;

  &.hasImage {
    border-style: solid;
    border-color: #185b4e;
  }

  &.disabled {
    opacity: 0.6;
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
}

.upload-icon {
  font-size: 56rpx;
  color: #185b4e;
  font-weight: 300;
}

.upload-text {
  font-size: 24rpx;
  color: #7a7267;
  margin-top: 8rpx;
}

.ocr-tip {
  font-size: 20rpx;
  color: #185b4e;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: rgba(24, 91, 78, 0.1);
  border-radius: 20rpx;
}

.uploading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

// 文件上传
.file-upload {
  width: 100%;
}

.file-upload-box {
  width: 100%;
  min-height: 88rpx;
  background: #f8f6f1;
  border: 2rpx solid transparent;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  transition: all 0.2s ease;

  &.hasFile {
    background: #fff;
    border-color: #185b4e;
  }

  &.disabled {
    opacity: 0.6;
  }
}

.file-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.file-name {
  font-size: 26rpx;
  color: #1d1a16;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

// 底部按钮
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  box-shadow: 0 -4rpx 20rpx rgba(48, 38, 24, 0.08);
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.progress-indicator {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.progress-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d4cfc4;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(135deg, #185b4e 0%, #2d8a78 100%);
    width: 32rpx;
    border-radius: 8rpx;
  }
}

.action-buttons {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.prev-btn {
  background: #f0ebe0;
  color: #5f5a52;
}

.next-btn {
  background: linear-gradient(135deg, #185b4e 0%, #2d8a78 100%);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(24, 91, 78, 0.3);
}
</style>
