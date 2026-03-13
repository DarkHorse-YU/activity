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

export interface ICouponVerificationFormField {
  fieldId: number
  fieldCode: string
  fieldName: string
  fieldType: CouponVerificationFieldType
  valueSeq?: number
  value?: string
  fileId?: number | null
  isRequired: 0 | 1
  isUserEditable: 0 | 1
  sortNo: number
  enumOptions: string | null
  validationRule: string | null
  ocrEnabled: 0 | 1
  ocrMappingKey: string | null
  isCalculated: 0 | 1
}

export interface ICouponVerificationFormGroup {
  groupName: string
  groupSort: number
  fields: ICouponVerificationFormField[]
}

export interface ICouponVerificationFormTemplate {
  recordId: number
  activityId: number
  activityCode: string
  activityName: string
  templateId: number
  templateCode: string
  templateName: string
  groups: ICouponVerificationFormGroup[]
}

export interface ICouponVerificationRuleItem {
  id: number | string
  title: string
  content: string
  sort?: number
}

export interface ICouponVerificationRecordItem {
  id: number
  verificationNo: string
  couponCode: string
  couponTitle: string
  merchantName: string
  currentStatus: CouponVerificationStatus | string
  needVoucher: boolean
  verifiedAt: string
  reviewedAt?: string | null
  rejectCount?: number
}

export interface ICouponVerificationIssue {
  id: number
  fieldId: number
  fieldCode: string
  fieldName: string
  issueCode: string
  issueMessage: string
  status: string
  createdAt: string
}

export interface ICouponVerificationSubmission {
  submissionId: number
  submissionNo: number
  status: string
  submittedAt: string
  reviewedAt: string | null
  reviewerId: number | null
  reviewComment: string | null
  groups: ICouponVerificationFormGroup[]
  issues: ICouponVerificationIssue[]
}

export interface ICouponVerificationDetail {
  id: number
  verificationNo: string
  couponCode: string
  couponTitle: string
  activityId: number
  activityName: string
  merchantName: string
  currentStatus: CouponVerificationStatus | string
  needVoucher: boolean
  verifiedAt: string
  reviewedAt?: string | null
  rejectCount?: number
  currentSubmission?: ICouponVerificationSubmission | null
}

export interface ICouponVerificationActionRes {
  recordId: number
  verificationNo?: string
  currentStatus?: CouponVerificationStatus | string
  needVoucher: boolean
  message?: string
}

export interface ICouponVerificationUploadReq {
  file: File
  needOcr: boolean
  ocrMappingKey?: string | null
}

export interface ICouponVerificationOcrResult {
  [key: string]: string
}

export interface ICouponVerificationUploadRes {
  verificationFileId: number
  url: string
  thUrl: string
  ocrResult?: ICouponVerificationOcrResult
}
