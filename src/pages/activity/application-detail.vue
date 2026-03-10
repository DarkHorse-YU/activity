<script lang="ts" setup>
import { uploadSubsidyFile } from '@/api/login'
import { http } from '@/http/http'

defineOptions({
  name: 'ApplicationDetail',
})
definePage({
  style: {
    navigationBarTitleText: '申报详情',
  },
})

// 表单字段类型
interface FormField {
  fieldId: number
  fieldCode: string
  fieldName: string
  fieldType: 'text' | 'number' | 'date' | 'enum' | 'image' | 'phone' | 'money' | 'file' | 'json'
  valueSeq: number
  value: string
  fileId: number | null
  isRequired: 0 | 1
  isUserEditable: 0 | 1
  sortNo: number
  enumOptions: string | null
  validationRule: string | null
  ocrEnabled: 0 | 1
  ocrMappingKey: string | null
  isCalculated: 0 | 1
}

interface FormGroup {
  groupName: string
  groupSort: number
  fields: FormField[]
}

// 问题类型
interface FieldIssue {
  id: number
  fieldId: number
  fieldCode: string
  fieldName: string
  issueCode: string
  issueMessage: string
  status: string
  createdAt: string
}

// 提交信息
interface Submission {
  submissionId: number
  submissionNo: number
  status: string
  submittedAt: string
  reviewedAt: string | null
  reviewerId: number | null
  reviewComment: string | null
  groups: FormGroup[]
  issues: FieldIssue[]
}

// 申请详情类型
interface ApplicationDetail {
  id: number
  customerId: number
  applicationNo: string
  activityId: number
  activityName: string
  userId: string
  currentStatus: 'DRAFT' | 'PENDING' | 'REJECTED' | 'APPROVED'
  rejectCount: number
  approvedAt: string | null
  createdAt: string
  currentSubmission: Submission
}

// 状态映射
const statusMap: Record<string, { text: string, color: string }> = {
  DRAFT: { text: '草稿', color: '#999999' },
  PENDING: { text: '审核中', color: '#F99C5F' },
  REJECTED: { text: '已驳回', color: '#ff4d4f' },
  APPROVED: { text: '已通过', color: '#52c41a' },
}

// 状态
const loading = ref(true)
const applicationDetail = ref<ApplicationDetail | null>(null)
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

// 问题字段映射 (fieldCode -> issue)
const issueMap = ref<Map<string, FieldIssue>>(new Map())

// 计算属性
const groupCount = computed(() => applicationDetail.value?.currentSubmission?.groups?.length || 0)
const currentGroup = computed(() => applicationDetail.value?.currentSubmission?.groups?.[activeTab.value])
const isFirstTab = computed(() => activeTab.value === 0)
const isLastTab = computed(() => activeTab.value === groupCount.value - 1)
const isRejected = computed(() => applicationDetail.value?.currentStatus === 'REJECTED')

// 获取问题列表
const issues = computed(() => applicationDetail.value?.currentSubmission?.issues || [])

// 获取申请详情
async function fetchApplicationDetail(id: number) {
  try {
    loading.value = true
    applicationDetail.value = await http.get<ApplicationDetail>(`/activity/subsidy/user/application/${id}`)

    // 初始化表单数据
    initFormData()

    // 构建问题字段映射
    buildIssueMap()
  }
  catch (error) {
    console.error('获取申请详情失败:', error)
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

// 初始化表单数据
function initFormData() {
  const groups = applicationDetail.value?.currentSubmission?.groups || []
  groups.forEach((group) => {
    group.fields.forEach((field) => {
      formData.value[field.fieldCode] = field.value
      // 保存原始的 fileId
      if (field.fileId) {
        fieldExtraInfo.value[field.fieldCode] = {
          fileId: field.fileId,
        }
      }
    })
  })
}

// 构建问题字段映射
function buildIssueMap() {
  issueMap.value.clear()
  const issues = applicationDetail.value?.currentSubmission?.issues || []
  issues.forEach((issue) => {
    issueMap.value.set(issue.fieldCode, issue)
  })
}

// 检查字段是否有问题
function hasIssue(fieldCode: string): boolean {
  return issueMap.value.has(fieldCode)
}

// 获取字段的问题信息
function getIssue(fieldCode: string): FieldIssue | undefined {
  return issueMap.value.get(fieldCode)
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
function validateField(field: FormField, value: any): string | null {
  if (!value) {
    return null
  }

  const rule = parseValidationRule(field.validationRule)
  if (!rule || Object.keys(rule).length === 0) {
    return null
  }

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
function handleFieldBlur(field: FormField) {
  const value = formData.value[field.fieldCode]
  const error = validateField(field, value)
  if (error) {
    fieldErrors.value[field.fieldCode] = error
  }
  else {
    delete fieldErrors.value[field.fieldCode]
  }

  // 如果值被修改了，清除该字段的问题标记
  if (value) {
    issueMap.value.delete(field.fieldCode)
  }
}

// 处理选择器值变更（日期、枚举）
function handlePickerChange(field: FormField, value: string) {
  formData.value[field.fieldCode] = value
  // 清除该字段的问题标记
  issueMap.value.delete(field.fieldCode)
  // 清除校验错误
  delete fieldErrors.value[field.fieldCode]
}

// 字段是否禁用
function isFieldDisabled(field: FormField): boolean {
  if (field.isCalculated === 1)
    return true
  if (field.isUserEditable === 0)
    return true
  return false
}

// 上传图片
async function uploadImage(field: FormField) {
  if (uploadingFields.value.has(field.fieldCode)) {
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uploadingFields.value.add(field.fieldCode)

      uploadSubsidyFile(tempFilePath, {
        needOcr: field.ocrEnabled === 1,
        ocrMappingKey: field.ocrMappingKey,
      })
        .then((uploadRes) => {
          formData.value[field.fieldCode] = uploadRes.url

          fieldExtraInfo.value[field.fieldCode] = {
            ...fieldExtraInfo.value[field.fieldCode],
            fileId: uploadRes.subsidyFileId,
          }

          // 如果上传成功，清除该字段的问题标记
          issueMap.value.delete(field.fieldCode)

          if (uploadRes.ocrResult && Object.keys(uploadRes.ocrResult).length > 0) {
            fillOcrResult(uploadRes.ocrResult, uploadRes.subsidyFileId)
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
  const allFields = applicationDetail.value?.currentSubmission?.groups?.flatMap(g => g.fields) || []

  Object.entries(ocrResult).forEach(([key, value]) => {
    const targetField = allFields.find(f => f.fieldName === key)
    if (targetField && value) {
      if (targetField.isUserEditable === 1 && targetField.isCalculated !== 1) {
        formData.value[targetField.fieldCode] = value
        if (!fieldExtraInfo.value[targetField.fieldCode]) {
          fieldExtraInfo.value[targetField.fieldCode] = {}
        }
        fieldExtraInfo.value[targetField.fieldCode].fileId = fileId
        fieldExtraInfo.value[targetField.fieldCode].ocrAutofill = 1
        delete fieldErrors.value[targetField.fieldCode]
        // 清除 OCR 填充字段的问题标记
        issueMap.value.delete(targetField.fieldCode)
      }
    }
  })
}

// 重新提交
async function resubmit() {
  if (Object.keys(fieldErrors.value).length > 0) {
    uni.showToast({ title: '请修正表单中的错误', icon: 'none' })
    return
  }

  // 检查是否还有未解决的问题字段
  if (issueMap.value.size > 0) {
    uni.showToast({ title: '请修改所有问题字段', icon: 'none' })
    return
  }

  const allFields = applicationDetail.value?.currentSubmission?.groups?.flatMap(g => g.fields) || []

  // 校验所有字段
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

  // 准备提交数据
  const fieldValues = allFields.map((field) => {
    const value = formData.value[field.fieldCode]
    const extraInfo = fieldExtraInfo.value[field.fieldCode] || {}

    const fieldValue: Record<string, any> = {
      fieldCode: field.fieldCode,
      value,
    }

    if (extraInfo.fileId) {
      fieldValue.fileId = extraInfo.fileId
    }

    if (extraInfo.ocrAutofill) {
      fieldValue.ocrAutofill = 1
    }

    return fieldValue
  })

  const submitData = {
    activityId: applicationDetail.value?.activityId,
    fieldValues,
  }

  const applicationId = applicationDetail.value?.id

  try {
    uni.showLoading({ title: '提交中...' })
    await http.post(`/activity/subsidy/user/application/${applicationId}/resubmit`, submitData)
    uni.hideLoading()
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch (error) {
    uni.hideLoading()
    console.error('提交失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}

// 处理底部按钮点击
function handleBottomAction() {
  if (groupCount.value === 1) {
    resubmit()
  }
  else if (isLastTab.value) {
    resubmit()
  }
  else {
    nextStep()
  }
}

// 页面加载
onLoad((query: Record<string, any>) => {
  const id = query.id
  if (id) {
    fetchApplicationDetail(Number(id))
  }
  else {
    uni.showToast({ title: '缺少参数', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
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
      <text class="loading-text">加载详情中...</text>
    </view>

    <!-- 详情内容 -->
    <view v-else-if="applicationDetail" class="detail-content">
      <!-- 申请信息头部 -->
      <view class="info-header">
        <view class="info-row">
          <text class="info-label">申请编号</text>
          <text class="info-value">{{ applicationDetail.applicationNo }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">活动名称</text>
          <text class="info-value highlight">{{ applicationDetail.activityName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">申请状态</text>
          <view
            class="status-tag"
            :style="{ backgroundColor: statusMap[applicationDetail.currentStatus]?.color || '#999' }"
          >
            {{ statusMap[applicationDetail.currentStatus]?.text || applicationDetail.currentStatus }}
          </view>
        </view>
        <view class="info-row">
          <text class="info-label">申请时间</text>
          <text class="info-value">{{ applicationDetail.createdAt }}</text>
        </view>
      </view>

      <!-- 驳回提示 -->
      <view v-if="isRejected && issues.length > 0" class="reject-notice">
        <view class="notice-header">
          <text class="notice-icon">!</text>
          <text class="notice-title">审核驳回</text>
        </view>
        <text class="notice-desc">以下 {{ issues.length }} 项内容需要修改后重新提交：</text>
        <view class="issue-list">
          <view v-for="issue in issues" :key="issue.id" class="issue-item">
            <text class="issue-field">{{ issue.fieldName }}</text>
            <text class="issue-message">{{ issue.issueMessage }}</text>
          </view>
        </view>
      </view>

      <!-- 多个分组时显示 Tab -->
      <view v-if="groupCount > 1" class="tabs-container">
        <view
          v-for="(group, index) in applicationDetail.currentSubmission.groups"
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
          <view
            v-for="field in currentGroup?.fields"
            :key="field.fieldId"
            class="form-item"
            :class="{ 'has-issue': hasIssue(field.fieldCode) }"
          >
            <!-- 驳回提示 -->
            <view v-if="hasIssue(field.fieldCode)" class="field-issue-notice">
              <text class="issue-icon">!</text>
              <text class="issue-text">{{ getIssue(field.fieldCode)?.issueMessage }}</text>
            </view>

            <!-- 标签 -->
            <view class="field-label">
              <text class="label-text">{{ field.fieldName }}</text>
              <text v-if="field.isRequired === 1" class="required-mark">*</text>
              <view v-if="hasIssue(field.fieldCode)" class="issue-badge">
                需修改
              </view>
            </view>

            <!-- 文本输入 -->
            <template v-if="field.fieldType === 'text'">
              <input
                v-model="formData[field.fieldCode]"
                class="field-input"
                :class="{ 'disabled': isFieldDisabled(field), 'error': fieldErrors[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
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
                :class="{ 'disabled': isFieldDisabled(field), 'error': fieldErrors[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
                :disabled="isFieldDisabled(field)"
                :placeholder="`请输入${field.fieldName}`"
                placeholder-class="input-placeholder"
                @blur="handleFieldBlur(field)"
              >
              <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
            </template>

            <!-- 手机号输入 -->
            <template v-else-if="field.fieldType === 'phone'">
              <input
                v-model="formData[field.fieldCode]"
                type="number"
                class="field-input"
                :class="{ 'disabled': isFieldDisabled(field), 'error': fieldErrors[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
                :disabled="isFieldDisabled(field)"
                placeholder="请输入手机号"
                placeholder-class="input-placeholder"
                @blur="handleFieldBlur(field)"
              >
              <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
            </template>

            <!-- 金额输入 -->
            <template v-else-if="field.fieldType === 'money'">
              <view class="money-input-wrapper" :class="{ 'field-with-issue': hasIssue(field.fieldCode) }">
                <text class="money-prefix">¥</text>
                <input
                  v-model="formData[field.fieldCode]"
                  type="digit"
                  class="field-input money-input"
                  :class="{ disabled: isFieldDisabled(field), error: fieldErrors[field.fieldCode] }"
                  :disabled="isFieldDisabled(field)"
                  :placeholder="`请输入${field.fieldName}`"
                  placeholder-class="input-placeholder"
                  @blur="handleFieldBlur(field)"
                >
              </view>
              <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
            </template>

            <!-- 日期选择 -->
            <picker
              v-else-if="field.fieldType === 'date'"
              mode="date"
              :value="formData[field.fieldCode] || ''"
              @change="(e: any) => handlePickerChange(field, e.detail.value)"
            >
              <view
                class="field-picker"
                :class="{ 'disabled': isFieldDisabled(field), 'hasValue': formData[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
              >
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
              @change="(e: any) => handlePickerChange(field, parseEnumOptions(field.enumOptions)[e.detail.value])"
            >
              <view
                class="field-picker"
                :class="{ 'disabled': isFieldDisabled(field), 'hasValue': formData[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
              >
                <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
                <text v-else class="placeholder">请选择{{ field.fieldName }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>

            <!-- 图片上传 -->
            <view v-else-if="field.fieldType === 'image'" class="upload-container">
              <view
                class="upload-box"
                :class="{ 'disabled': isFieldDisabled(field), 'hasImage': formData[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
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
                :class="{ 'disabled': isFieldDisabled(field), 'hasFile': formData[field.fieldCode], 'field-with-issue': hasIssue(field.fieldCode) }"
              >
                <text class="file-icon">📄</text>
                <text v-if="formData[field.fieldCode]" class="file-name">{{ formData[field.fieldCode] }}</text>
                <text v-else class="placeholder">已上传文件</text>
              </view>
            </view>

            <!-- JSON 输入 -->
            <textarea
              v-else-if="field.fieldType === 'json'"
              v-model="formData[field.fieldCode]"
              class="field-textarea"
              :class="{ 'disabled': isFieldDisabled(field), 'field-with-issue': hasIssue(field.fieldCode) }"
              :disabled="isFieldDisabled(field)"
              :placeholder="`请输入${field.fieldName}`"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view v-if="isRejected" class="bottom-actions">
        <!-- 进度指示器 -->
        <view v-if="groupCount > 1" class="progress-indicator">
          <view v-for="i in groupCount" :key="i" class="progress-dot" :class="{ active: i - 1 <= activeTab }" />
        </view>

        <view class="action-buttons">
          <!-- 上一步按钮 -->
          <view v-if="groupCount > 1 && !isFirstTab" class="action-btn prev-btn" @tap="prevStep">
            上一步
          </view>

          <!-- 重新提交/下一步按钮 -->
          <view class="action-btn next-btn" @tap="handleBottomAction">
            <text v-if="groupCount === 1">重新提交</text>
            <text v-else-if="isLastTab">重新提交</text>
            <text v-else>下一步</text>
          </view>
        </view>
      </view>

      <!-- 已通过/审核中状态提示 -->
      <view v-else class="status-notice">
        <text v-if="applicationDetail.currentStatus === 'APPROVED'">该申请已通过审核</text>
        <text v-else-if="applicationDetail.currentStatus === 'PENDING'">该申请正在审核中</text>
        <text v-else>该申请为草稿状态</text>
      </view>
    </view>

    <!-- 加载失败 -->
    <view v-else class="error-container">
      <view class="error-icon-wrapper">
        <text class="error-icon">!</text>
      </view>
      <text class="error-title">加载失败</text>
      <text class="error-desc">请检查网络后重试</text>
      <view class="retry-btn" @tap="() => fetchApplicationDetail(applicationDetail?.id || 0)">
        重新加载
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff7f0 0%, #fafafa 30%, #f5f5f5 100%);
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
  background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
  top: -100rpx;
  right: -50rpx;
  filter: blur(60rpx);
}

.bg-circle-2 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #fbb97d 0%, #fcd5b5 100%);
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
  background: linear-gradient(135deg, #fff7f0 0%, #ffedd5 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.loading-text {
  color: #999;
  font-size: 28rpx;
}

// 详情内容
.detail-content {
  padding: 32rpx;
  position: relative;
  z-index: 1;
}

// 信息头部
.info-header {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx solid #f5f5f5;
  }
}

.info-label {
  font-size: 26rpx;
  color: #999;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;

  &.highlight {
    color: #f99c5f;
  }
}

.status-tag {
  font-size: 22rpx;
  color: #fff;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

// 驳回提示
.reject-notice {
  background: linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #ffccc7;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.notice-icon {
  width: 36rpx;
  height: 36rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
}

.notice-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.notice-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  background: rgba(255, 77, 79, 0.08);
  border-radius: 12rpx;
}

.issue-field {
  font-size: 24rpx;
  color: #ff4d4f;
  font-weight: 600;
  flex-shrink: 0;

  &::after {
    content: '：';
  }
}

.issue-message {
  font-size: 24rpx;
  color: #666;
}

// Tab 样式
.tabs-container {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 12rpx;
  position: relative;
  transition: all 0.3s ease;

  &.active {
    color: #f99c5f;
    font-weight: 600;
    background: rgba(249, 156, 95, 0.1);
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
  background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
  border-radius: 3rpx;
}

// 表单卡片
.form-card {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

// 分组标题
.group-header {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background: linear-gradient(135deg, #fff7f0 0%, #ffedd5 100%);
  border-bottom: 1rpx solid #f0f0f0;
}

.group-icon {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
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
  color: #333;
}

// 表单字段样式
.form-fields {
  padding: 24rpx;
}

.form-item {
  margin-bottom: 32rpx;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }

  &.has-issue {
    padding: 16rpx;
    margin: -16rpx;
    margin-bottom: 16rpx;
    background: rgba(255, 77, 79, 0.04);
    border-radius: 12rpx;
    border: 2rpx solid rgba(255, 77, 79, 0.15);
  }
}

// 字段问题提示
.field-issue-notice {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
  padding: 10rpx 16rpx;
  background: #fff2f0;
  border-radius: 8rpx;
}

.issue-icon {
  width: 24rpx;
  height: 24rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: bold;
}

.issue-text {
  font-size: 24rpx;
  color: #ff4d4f;
  font-weight: 500;
}

.field-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.label-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.required-mark {
  color: #ff4d4f;
  margin-left: 8rpx;
}

.issue-badge {
  margin-left: 12rpx;
  padding: 4rpx 12rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  border-radius: 20rpx;
  font-weight: 500;
}

.field-input,
.field-picker,
.field-textarea {
  width: 100%;
  min-height: 88rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:focus {
    border-color: #f99c5f;
    background: #fff;
  }
}

.field-with-issue {
  border-color: #ff4d4f !important;
  background: #fff !important;
}

.input-placeholder {
  color: #bbb;
}

.field-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  &.hasValue {
    background: #fff;
    border-color: #f99c5f;
  }
}

.picker-arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: 300;
}

.field-input.error {
  border-color: #ff4d4f;
  background: #fff;
}

.field-error {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}

.field-input.disabled,
.field-picker.disabled {
  background: #f5f5f5;
  color: #999;
  opacity: 0.7;
}

.field-textarea {
  min-height: 160rpx;
  padding: 20rpx 24rpx;
}

.placeholder {
  color: #bbb;
}

// 金额输入
.money-input-wrapper {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #f99c5f;
    background: #fff;
  }
}

.money-prefix {
  padding-left: 24rpx;
  font-size: 28rpx;
  color: #f99c5f;
  font-weight: 600;
}

.money-input {
  background: transparent !important;
  border: none !important;
}

// 上传样式
.upload-container {
  position: relative;
}

.upload-box {
  width: 200rpx;
  height: 200rpx;
  background: #f8f9fa;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;

  &.hasImage {
    border-style: solid;
    border-color: #f99c5f;
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
  color: #f99c5f;
  font-weight: 300;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.ocr-tip {
  font-size: 20rpx;
  color: #f99c5f;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: rgba(249, 156, 95, 0.1);
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
  background: #f8f9fa;
  border: 2rpx solid transparent;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  transition: all 0.2s ease;

  &.hasFile {
    background: #fff;
    border-color: #f99c5f;
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
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

// 状态提示
.status-notice {
  text-align: center;
  padding: 60rpx 32rpx;
  font-size: 28rpx;
  color: #999;
}

// 底部按钮
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
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
  background: #e0e0e0;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
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
}

.prev-btn {
  background: #f5f5f5;
  color: #666;
}

.next-btn {
  background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(249, 156, 95, 0.3);
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
  color: #ff4d4f;
  font-weight: bold;
}

.error-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.error-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.retry-btn {
  padding: 20rpx 64rpx;
  background: linear-gradient(135deg, #f99c5f 0%, #fbb97d 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 8rpx 24rpx rgba(249, 156, 95, 0.3);
}
</style>
