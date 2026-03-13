import type { ISubsidyFileUploadRes } from './types/subsidy-activity'
import { http } from '@/http/http'

export function getSubsidyFormTemplate<T>(activityCode: string) {
  return http.get<T>('/activity/subsidy/user/form', {
    activityCode,
  })
}

export function submitSubsidyApplication<T = void>(data: Record<string, any>) {
  return http.post<T>('/activity/subsidy/user/application', data)
}

export function getSubsidyApplicationList<T>(params: Record<string, any>) {
  return http.get<T>('/activity/subsidy/user/application', params)
}

export function getSubsidyApplicationDetail<T>(id: number | string) {
  return http.get<T>(`/activity/subsidy/user/application/${id}`)
}

export function resubmitSubsidyApplication<T = void>(id: number | string, data: Record<string, any>) {
  return http.post<T>(`/activity/subsidy/user/application/${id}/resubmit`, data)
}

export function uploadSubsidyFile(
  filePath: string,
  options: {
    needOcr: boolean
    ocrMappingKey?: string | null
  },
): Promise<ISubsidyFileUploadRes> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: `${import.meta.env.VITE_SERVER_BASEURL}/activity/subsidy/user/file`,
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
