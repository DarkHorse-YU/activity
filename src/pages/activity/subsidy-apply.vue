<script lang="ts" setup>
import { uploadSubsidyFile } from '@/api/login'
import { http } from '@/http/http'

defineOptions({
  name: 'SubsidyApply',
})
definePage({
  style: {
    navigationBarTitleText: '补贴申报',
  },
})

// 表单模板数据类型
interface FormField {
  fieldId: number
  fieldCode: string
  fieldName: string
  fieldType: 'text' | 'number' | 'date' | 'enum' | 'image' | 'phone' | 'money' | 'file' | 'json'
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

interface FormTemplate {
  activityId: number
  activityCode: string
  activityName: string
  templateId: number
  templateCode: string
  templateName: string
  groups: FormGroup[]
}

// 状态
const loading = ref(true)
const formTemplate = ref<FormTemplate | null>(null)
const activeTab = ref(0)
const formData = ref<Record<string, any>>({})
const uploadingFields = ref<Set<string>>(new Set())

// 字段额外信息（用于提交）
interface FieldExtraInfo {
  fileId?: number
  ocrAutofill?: 1
}
const fieldExtraInfo = ref<Record<string, FieldExtraInfo>>({})

// 计算属性
const groupCount = computed(() => formTemplate.value?.groups?.length || 0)
const currentGroup = computed(() => formTemplate.value?.groups?.[activeTab.value])
const isFirstTab = computed(() => activeTab.value === 0)
const isLastTab = computed(() => activeTab.value === groupCount.value - 1)

// 获取表单模板
async function fetchFormTemplate() {
  try {
    loading.value = true
    const res = await http.get<FormTemplate>('/activity/subsidy/user/form', {
      activityCode: 'CAR_SUBSIDY_2026_SPRING',
    })
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

// 字段校验错误信息
const fieldErrors = ref<Record<string, string>>({})

// 校验单个字段
function validateField(field: FormField, value: any): string | null {
  // 如果没有值，不需要校验格式（必填校验在提交时进行）
  if (!value) {
    return null
  }

  const rule = parseValidationRule(field.validationRule)
  if (!rule || Object.keys(rule).length === 0) {
    return null
  }

  const strValue = String(value)

  // 正则校验（支持 regex 或 pattern 字段名）
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
}

// 字段是否禁用
function isFieldDisabled(field: FormField): boolean {
  // 自动计算的字段禁用
  if (field.isCalculated === 1)
    return true
  // 用户不可编辑的字段禁用
  if (field.isUserEditable === 0)
    return true
  return false
}

// 上传图片
async function uploadImage(field: FormField) {
  // 防止重复点击
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

      // 使用 Promise 链式调用
      uploadSubsidyFile(tempFilePath, {
        needOcr: field.ocrEnabled === 1,
        ocrMappingKey: field.ocrMappingKey,
      })
        .then((uploadRes) => {
          // 保存上传后的 URL
          formData.value[field.fieldCode] = uploadRes.url

          // 保存文件 ID 到字段额外信息
          fieldExtraInfo.value[field.fieldCode] = {
            ...fieldExtraInfo.value[field.fieldCode],
            fileId: uploadRes.subsidyFileId,
          }

          // 如果有 OCR 识别结果，自动填充对应字段
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
  // 获取所有字段
  const allFields = formTemplate.value?.groups?.flatMap(g => g.fields) || []

  // 遍历 OCR 结果,找到对应的字段进行填充
  Object.entries(ocrResult).forEach(([key, value]) => {
    // 根据 fieldName 查找对应的字段
    const targetField = allFields.find(f => f.fieldName === key)
    if (targetField && value) {
      // 如果字段可编辑,则填充值
      if (targetField.isUserEditable === 1 && targetField.isCalculated !== 1) {
        formData.value[targetField.fieldCode] = value
        // 记录 OCR 自动填充信息和关联的文件 ID
        if (!fieldExtraInfo.value[targetField.fieldCode]) {
          fieldExtraInfo.value[targetField.fieldCode] = {}
        }
        fieldExtraInfo.value[targetField.fieldCode].fileId = fileId
        fieldExtraInfo.value[targetField.fieldCode].ocrAutofill = 1
        // 清除该字段的校验错误（如果有）
        delete fieldErrors.value[targetField.fieldCode]
      }
    }
  })
}

// 上传文件
async function uploadFile(field: FormField) {
  // #ifdef H5
  // H5 环境使用 input 选择文件
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '*/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file)
      return

    uploadingFields.value.add(field.fieldCode)
    try {
      // 创建临时 URL 用于上传
      const tempFilePath = URL.createObjectURL(file)
      const uploadRes = await uploadSubsidyFile(tempFilePath, {
        needOcr: false,
      })
      formData.value[field.fieldCode] = uploadRes.url
      formData.value[`${field.fieldCode}_fileId`] = uploadRes.subsidyFileId
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
  // 非 H5 环境使用 uni.chooseFile
  uni.chooseFile({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uploadingFields.value.add(field.fieldCode)

      try {
        const uploadRes = await uploadSubsidyFile(tempFilePath, {
          needOcr: false,
        })
        formData.value[field.fieldCode] = uploadRes.url
        formData.value[`${field.fieldCode}_fileId`] = uploadRes.subsidyFileId
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
  // 如果存在校验错误,不允许提交
  if (Object.keys(fieldErrors.value).length > 0) {
    uni.showToast({ title: '请修正表单中的错误', icon: 'none' })
    return
  }

  // 校验所有字段
  const allFields = formTemplate.value?.groups?.flatMap(g => g.fields) || []
  for (const field of allFields) {
    const value = formData.value[field.fieldCode]

    // 必填校验
    if (field.isRequired === 1 && !value) {
      uni.showToast({ title: `请填写${field.fieldName}`, icon: 'none' })
      return
    }

    // validationRule 校验
    const validationError = validateField(field, value)
    if (validationError) {
      uni.showToast({ title: validationError, icon: 'none' })
      return
    }
  }

  // 准备提交数据 - 按照新格式组装
  const fieldValues = allFields.map((field) => {
    const value = formData.value[field.fieldCode]
    const extraInfo = fieldExtraInfo.value[field.fieldCode] || {}

    const fieldValue: Record<string, any> = {
      fieldCode: field.fieldCode,
      value,
    }

    // 如果有 fileId,添加到提交数据中
    if (extraInfo.fileId) {
      fieldValue.fileId = extraInfo.fileId
    }

    // 如果是 OCR 自动填充的字段,添加 ocrAutofill
    if (extraInfo.ocrAutofill) {
      fieldValue.ocrAutofill = 1
    }

    return fieldValue
  })

  const submitData = {
    activityId: formTemplate.value?.activityId,
    fieldValues,
  }

  try {
    await http.post('/activity/subsidy/user/application', submitData)
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 1500)
  }
  catch (error) {
    console.error('提交失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}

// 处理底部按钮点击
function handleBottomAction() {
  if (groupCount.value === 1) {
    // 只有一个分组，直接提交
    submitForm()
  }
  else if (isLastTab.value) {
    // 最后一个 tab，提交
    submitForm()
  }
  else {
    // 下一步
    nextStep()
  }
}

// 页面加载
onLoad(() => {
  fetchFormTemplate()
})
</script>

<template>
  <view class="page-container">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <wd-loading />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 表单内容 -->
    <view v-else-if="formTemplate" class="form-content">
      <!-- 多个分组时显示 Tab -->
      <view v-if="groupCount > 1" class="tabs-container">
        <view
          v-for="(group, index) in formTemplate.groups"
          :key="index"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @tap="switchTab(index)"
        >
          {{ group.groupName }}
        </view>
      </view>

      <!-- 当前分组的标题 -->
      <view v-if="groupCount > 1" class="group-title">
        {{ currentGroup?.groupName }}
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
              :class="{ disabled: isFieldDisabled(field), error: fieldErrors[field.fieldCode] }"
              :disabled="isFieldDisabled(field)"
              placeholder="请输入手机号"
              @blur="handleFieldBlur(field)"
            >
            <text v-if="fieldErrors[field.fieldCode]" class="field-error">{{ fieldErrors[field.fieldCode] }}</text>
          </template>

          <!-- 金额输入 -->
          <template v-else-if="field.fieldType === 'money'">
            <input
              v-model="formData[field.fieldCode]"
              type="digit"
              class="field-input"
              :class="{ disabled: isFieldDisabled(field), error: fieldErrors[field.fieldCode] }"
              :disabled="isFieldDisabled(field)"
              :placeholder="`请输入${field.fieldName}`"
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
            <view class="field-picker" :class="{ disabled: isFieldDisabled(field) }">
              <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
              <text v-else class="placeholder">请选择{{ field.fieldName }}</text>
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
            <view class="field-picker" :class="{ disabled: isFieldDisabled(field) }">
              <text v-if="formData[field.fieldCode]">{{ formData[field.fieldCode] }}</text>
              <text v-else class="placeholder">请选择{{ field.fieldName }}</text>
            </view>
          </picker>

          <!-- 图片上传 -->
          <view v-else-if="field.fieldType === 'image'" class="upload-container">
            <view
              class="upload-box"
              :class="{ disabled: isFieldDisabled(field) }"
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
          <view v-else-if="field.fieldType === 'file'" class="upload-container">
            <view
              class="file-upload-box"
              :class="{ disabled: isFieldDisabled(field) }"
              @tap="!isFieldDisabled(field) && uploadFile(field)"
            >
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
          />
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="bottom-actions">
        <!-- 上一步按钮 -->
        <view v-if="groupCount > 1 && !isFirstTab" class="action-btn prev-btn" @tap="prevStep">
          上一步
        </view>

        <!-- 提交/下一步按钮 -->
        <view class="action-btn next-btn" @tap="handleBottomAction">
          <text v-if="groupCount === 1">提交申报</text>
          <text v-else-if="isLastTab">提交申报</text>
          <text v-else>下一步</text>
        </view>
      </view>
    </view>

    <!-- 加载失败 -->
    <view v-else class="error-container">
      <text class="error-text">加载失败，请重试</text>
      <view class="retry-btn" @tap="fetchFormTemplate">
        重新加载
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.loading-text {
  margin-top: 20rpx;
  color: #999;
  font-size: 28rpx;
}

.error-text {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.retry-btn {
  padding: 16rpx 48rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.form-content {
  padding: 24rpx;
}

// Tab 样式
.tabs-container {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 12rpx;
  transition: all 0.3s;

  &.active {
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    color: #fff;
    font-weight: bold;
  }
}

.group-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  padding: 24rpx 0;
  margin-bottom: 16rpx;
}

// 表单字段样式
.form-fields {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.field-label {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.label-text {
  font-size: 28rpx;
  color: #333;
}

.required-mark {
  color: #ff4d4f;
  margin-left: 8rpx;
}

.field-input,
.field-picker,
.field-textarea {
  width: 100%;
  min-height: 88rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid #eee;
}

.field-input.error {
  border-color: #ff4d4f;
}

.field-error {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-top: 8rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.field-input.disabled,
.field-picker.disabled {
  background: #f0f0f0;
  color: #999;
}

.field-textarea {
  min-height: 160rpx;
  padding: 20rpx 24rpx;
}

.placeholder {
  color: #bbb;
}

// 上传样式
.upload-container {
  position: relative;
}

.upload-box {
  width: 200rpx;
  height: 200rpx;
  background: #f8f8f8;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;

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
  font-size: 48rpx;
  color: #ccc;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.ocr-tip {
  font-size: 20rpx;
  color: #ff7875;
  margin-top: 8rpx;
}

.uploading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload-box {
  width: 100%;
  height: 88rpx;
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;

  &.disabled {
    opacity: 0.6;
  }
}

.file-name {
  font-size: 26rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 底部按钮
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.action-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.prev-btn {
  background: #f5f5f5;
  color: #666;
}

.next-btn {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #fff;
}
</style>
