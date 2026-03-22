import type {
  ICouponReviewDetail,
  ICouponVerificationActionRes,
  ICouponVerificationUploadRes,
  ICouponWriteOffFormTemplate,
  ICouponWriteOffPrepareData,
  ICouponWriteOffRecordItem,
} from './types/coupon-verification'
import { http } from '@/http/http'

const WRITE_OFF_URL = '/coupon/merchant/write-off'
const FORM_URL = '/coupon/merchant/form'
const UPLOAD_URL = '/coupon/merchant/upload'

// 扫码核销预检（查询券信息）
export function prepareWriteOff<T = ICouponWriteOffPrepareData>(qrToken: string) {
  return http.get<T>(`${WRITE_OFF_URL}/prepare`, { qrToken })
}

// 确认核销
export function confirmWriteOff<T = ICouponVerificationActionRes>(data: {
  couponNo: string
  writeOffMode: 'QR_SCAN' | 'CODE_INPUT'
  requestNo: string
  remark?: string
}) {
  return http.post<T>(WRITE_OFF_URL, data)
}

// 查询核销列表
export function getWriteOffList<T = { list: ICouponWriteOffRecordItem[], total: number }>(params?: {
  page?: number
  size?: number
}) {
  return http.get<T>(`${WRITE_OFF_URL}/list`, params)
}

// 查询当前模板表单
export function getWriteOffFormTemplate<T = ICouponWriteOffFormTemplate>(templateId: number) {
  return http.get<T>(FORM_URL, { templateId })
}

// 上传凭证文件
export function uploadWriteOffFile(
  filePath: string,
  options: {
    needOcr?: boolean
    ocrMappingKey?: string | null
    parentPath?: string
  } = {},
): Promise<ICouponVerificationUploadRes> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: `${import.meta.env.VITE_SERVER_BASEURL}${UPLOAD_URL}`,
      filePath,
      name: 'file',
      formData: {
        needOcr: options.needOcr ? 'true' : 'false',
        ...(options.ocrMappingKey ? { ocrMappingKey: options.ocrMappingKey } : {}),
        ...(options.parentPath ? { parentPath: options.parentPath } : {}),
      },
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.code === '0' && data.success) {
              resolve(data.data)
            }
            else {
              reject(new Error(data.msg || '上传失败'))
            }
          }
          catch {
            reject(new Error('解析响应失败'))
          }
        }
        else {
          reject(new Error(`上传失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

// 提交凭证
export function submitWriteOffVoucher<T = void>(recordId: number, data: {
  remark?: string
  fieldValues: Array<{
    fieldCode: string
    valueSeq?: number
    value: any
    fileId?: number
    ocrAutofill?: 0 | 1
  }>
}) {
  return http.post<T>(`${WRITE_OFF_URL}/${recordId}/submit`, data)
}

// 查询核销详情（审核端）
export function getCouponReviewDetail<T = ICouponReviewDetail>(id: number | string) {
  return http.get<T>(`/coupon/reviewer/write-off/${id}`)
}

// 重新提交核销凭证
export function resubmitCouponReviewVoucher<T = void>(id: number | string, data: {
  fieldValues: Array<{
    fieldCode: string
    value: any
    fileId?: number
    ocrAutofill?: 0 | 1
  }>
}) {
  return http.post<T>(`${WRITE_OFF_URL}/${id}/resubmit`, data)
}

// 导出类型
export type {
  ICouponReviewDetail,
  ICouponReviewFieldIssue,
  ICouponReviewFormField,
  ICouponReviewFormGroup,
  ICouponReviewSubmission,
} from './types/coupon-verification'
