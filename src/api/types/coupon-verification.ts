export type CouponVerificationStatus
  = 'PENDING_VOUCHER'
    | 'PENDING_REVIEW'
    | 'REJECTED'
    | 'APPROVED'

export type CouponVerificationFieldType
  = 'text'
    | 'number'
    | 'date'
    | 'enum'
    | 'image'
    | 'phone'
    | 'money'
    | 'file'
    | 'json'

export interface ICouponVerificationActionRes {
  recordId: number
  verificationNo?: string
  currentStatus?: CouponVerificationStatus | string
  needVoucher: boolean
  message?: string
}

export interface ICouponVerificationOcrResult {
  [key: string]: string
}

export interface ICouponVerificationUploadRes {
  fileId: number
  url: string
  thUrl: string
  fileName: string
  originalName: string
  size: number
  ocrResult?: ICouponVerificationOcrResult
}

// 核销列表项
export interface ICouponWriteOffRecordItem {
  id: number
  couponNo: string
  activityId: number
  activityName: string
  deptId: number
  deptName: string
  templateId: number
  templateName: string
  needUploadProof: boolean
  couponType: 'DISCOUNT' | 'CASH'
  discountRate: number | null
  discountAmount: number | null
  writeOffMode: 'QR_SCAN' | 'CODE_INPUT'
  userWriteOffStatus: 'UNUSED' | 'APPROVED' | 'EXPIRED' | 'CANCELLED'
  userWriteOffStatusDesc: string
  auditStatus: 'PENDING_UPLOAD' | 'PENDING_AUDIT' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  auditStatusDesc: string
  submissionCount: number
  currentSubmissionNo: string | null
  writeOffTime: string
  auditTime: string | null
}

// 扫码核销预检返回
export interface ICouponWriteOffPrepareData {
  canWriteOff: boolean
  cannotReason: string | null
  claimId: number
  couponNo: string
  activityId: number
  activityName: string
  templateId: number | null
  templateName: string
  couponType: 'DISCOUNT' | 'CASH'
  discountRate: number | null
  discountAmount: number | null
  thresholdAmount: number | null
}

// 凭证表单字段
export interface ICouponWriteOffFormField {
  fieldId: number
  fieldCode: string
  fieldName: string
  fieldType: 'text' | 'number' | 'date' | 'enum' | 'image' | 'file' | 'json'
  isRequired: 0 | 1
  isEditable: 0 | 1
  sortNo: number
  enumOptions: string | null
  validationRule: string | null
  ocrEnabled: 0 | 1
  ocrMappingKey: string | null
}

// 凭证表单分组
export interface ICouponWriteOffFormGroup {
  groupName: string
  groupSort: number
  fields: ICouponWriteOffFormField[]
}

// 凭证表单模板
export interface ICouponWriteOffFormTemplate {
  activityId: number
  activityCode: string
  activityName: string
  auditMode: 'NONE' | 'MANUAL'
  templateId: number
  templateCode: string
  templateName: string
  templateVersion: number
  formTemplateId: number
  groups: ICouponWriteOffFormGroup[]
}

// 核销详情 - 表单字段（审核端）
export interface ICouponReviewFormField {
  fieldId: number
  fieldCode: string
  fieldName: string
  fieldType: 'text' | 'number' | 'date' | 'enum' | 'image' | 'phone' | 'money' | 'file' | 'json'
  valueSeq: number | null
  value: string | null
  fileId: number | null
  fileUrl: string | null
  isRequired: number
  isEditable: number
  sortNo: number
  enumOptions: string | null
  validationRule: string | null
  ocrEnabled: number
  ocrMappingKey: string | null
}

// 核销详情 - 表单分组（审核端）
export interface ICouponReviewFormGroup {
  groupName: string
  groupSort: number
  fields: ICouponReviewFormField[]
}

// 核销详情 - 问题记录（审核端）
export interface ICouponReviewFieldIssue {
  id: number
  fieldId: number
  fieldCode: string
  fieldName: string
  issueCode: string
  issueMessage: string
  status: string
  fixedInSubmissionId: number | null
  createdAt: string
}

// 核销详情 - 当前提交信息（审核端）
export interface ICouponReviewSubmission {
  submissionId: number
  submissionNo: number
  status: string
  submittedBy: number | null
  submittedAt: string
  reviewerId: number | null
  reviewedAt: string | null
  reviewComment: string | null
  groups: ICouponReviewFormGroup[]
  issues: ICouponReviewFieldIssue[] | null
}

// 核销详情 - 完整数据（审核端）
export interface ICouponReviewDetail {
  id: number
  claimId: number
  couponNo: string
  activityId: number
  activityName: string
  templateId: number
  templateName: string
  couponType: 'DISCOUNT' | 'CASH'
  discountRate: number | null
  discountAmount: number | null
  thresholdAmount: number | null
  formTemplateId: number | null
  writeOffMode: 'QR_SCAN' | 'CODE_INPUT'
  userWriteOffStatus: 'UNUSED' | 'APPROVED' | 'EXPIRED' | 'CANCELLED'
  userWriteOffStatusDesc: string
  auditStatus: 'PENDING_UPLOAD' | 'PENDING_AUDIT' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  auditStatusDesc: string
  status: string
  statusDesc: string
  remark: string | null
  writeOffTime: string | null
  currentSubmissionId: number | null
  auditReviewerId: number | null
  auditTime: string | null
  auditComment: string | null
  templateGroups: ICouponReviewFormGroup[]
  currentSubmission: ICouponReviewSubmission | null
}
