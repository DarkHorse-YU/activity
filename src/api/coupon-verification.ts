import type {
  ICouponVerificationActionRes,
  ICouponVerificationUploadRes,
  ICouponWriteOffPrepareData,
} from './types/coupon-verification'
import { http } from '@/http/http'

const BASE_URL = '/merchant/coupon/verification'
const WRITE_OFF_URL = '/coupon/merchant/write-off'

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

// 旧接口（保留兼容）
export function verifyCouponByScan<T = ICouponVerificationActionRes>(data: Record<string, any>) {
  return http.post<T>(`${BASE_URL}/scan`, data)
}

export function verifyCouponByCode<T = ICouponVerificationActionRes>(data: Record<string, any>) {
  return http.post<T>(`${BASE_URL}/code`, data)
}

export function getCouponVerificationRecords<T>(params?: Record<string, any>) {
  return http.get<T>(`${BASE_URL}/records`, params)
}

export function getCouponVerificationRules<T>() {
  return http.get<T>(`${BASE_URL}/rules`)
}

export function getCouponVerificationVoucherTemplate<T>(id: number | string) {
  return http.get<T>(`${BASE_URL}/${id}/voucher-form`)
}

export function submitCouponVerificationVoucher<T = void>(id: number | string, data: Record<string, any>) {
  return http.post<T>(`${BASE_URL}/${id}/voucher`, data)
}

export function getCouponVerificationDetail<T>(id: number | string) {
  return http.get<T>(`${BASE_URL}/${id}`)
}

export function resubmitCouponVerification<T = void>(id: number | string, data: Record<string, any>) {
  return http.post<T>(`${BASE_URL}/${id}/resubmit`, data)
}

export function uploadCouponVerificationFile(
  filePath: string,
  options: {
    needOcr: boolean
    ocrMappingKey?: string | null
  },
): Promise<ICouponVerificationUploadRes> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: `${import.meta.env.VITE_SERVER_BASEURL}${BASE_URL}/file`,
      filePath,
      name: 'file',
      formData: {
        needOcr: options.needOcr ? 'true' : 'false',
        ...(options.ocrMappingKey ? { ocrMappingKey: options.ocrMappingKey } : {}),
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
