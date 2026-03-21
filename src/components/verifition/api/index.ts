/**
 * 验证码 API
 * 适配项目的 /captcha/behavior 接口
 */

// 后端响应格式
interface CaptchaResponse {
  repCode?: string
  repMsg?: string
  repData?: {
    originalImageBase64: string
    jigsawImageBase64?: string
    token: string
    secretKey: string
    result?: boolean
    captchaVerification?: string
  }
  success?: boolean
  data?: any
  code?: string | number
  message?: string
  // 直接返回的字段
  originalImageBase64?: string
  jigsawImageBase64?: string
  token?: string
  secretKey?: string
}

// 统一处理的响应数据
interface NormalizedData {
  originalImageBase64: string
  jigsawImageBase64: string
  token: string
  secretKey: string
}

/**
 * 统一响应格式
 */
function normalizeResponse(response: CaptchaResponse): NormalizedData | null {
  // AJ-Captcha 官方格式: { repCode: '0000', repData: { ... } }
  if (response.repData?.token) {
    return {
      originalImageBase64: response.repData.originalImageBase64,
      jigsawImageBase64: response.repData.jigsawImageBase64 || '',
      token: response.repData.token,
      secretKey: response.repData.secretKey || '',
    }
  }

  // 后端直接返回 data 字段
  if (response.data?.token) {
    return {
      originalImageBase64: response.data.originalImageBase64,
      jigsawImageBase64: response.data.jigsawImageBase64 || '',
      token: response.data.token,
      secretKey: response.data.secretKey || '',
    }
  }

  // 直接在根级别返回字段
  if (response.token) {
    return {
      originalImageBase64: response.originalImageBase64 || '',
      jigsawImageBase64: response.jigsawImageBase64 || '',
      token: response.token,
      secretKey: response.secretKey || '',
    }
  }

  return null
}

/**
 * 提取 captchaVerification
 */
function extractCaptchaVerification(response: CaptchaResponse): string | null {
  if (response.repData?.captchaVerification) {
    return response.repData.captchaVerification
  }
  if (response.data?.captchaVerification) {
    return response.data.captchaVerification
  }
  if ((response as any).captchaVerification) {
    return (response as any).captchaVerification
  }
  return null
}

/**
 * 获取验证码图片
 * 项目接口: GET /captcha/behavior
 */
export function reqGet(data: { captchaType: string, clientUid?: string | null, ts?: number }): Promise<NormalizedData> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `/captcha/behavior`,
      method: 'GET',
      data,
      dataType: 'json',
      success: (res) => {
        if (res.statusCode === 200) {
          const responseData = res.data as CaptchaResponse
          const normalized = normalizeResponse(responseData)

          if (normalized) {
            resolve(normalized)
          }
          else {
            console.error('[Captcha] Failed to normalize response:', responseData)
            reject(new Error((responseData as any).repMsg || (responseData as any).message || '获取验证码失败'))
          }
        }
        else {
          reject(new Error('请求失败'))
        }
      },
      fail: (err) => {
        console.error('[Captcha] GET request failed:', err)
        reject(err)
      },
    })
  })
}

/**
 * 验证码校验
 * 项目接口: POST /captcha/behavior
 */
export function reqCheck(data: { captchaType: string, pointJson: string, token: string }): Promise<{ success: boolean, captchaVerification?: string }> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `/captcha/behavior`,
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json',
      },
      dataType: 'json',
      success: (res) => {
        if (res.statusCode === 200) {
          const responseData = res.data as CaptchaResponse
          const captchaVerification = extractCaptchaVerification(responseData)

          // 检查嵌套的 data 字段中的验证结果
          const innerData = responseData.data
          const innerRepCode = innerData?.repCode || responseData.repCode
          const innerRepMsg = innerData?.repMsg || (responseData as any).repMsg

          // AJ-Captcha 官方格式 (可能在根级别或 data 内部)
          if (innerRepCode === '0000') {
            resolve({
              success: true,
              captchaVerification,
            })
          }
          // code: 0 或 code: 200 (仅当内部没有错误时)
          else if (!innerRepCode && (responseData.code === 0 || responseData.code === 200 || responseData.code === '0' || responseData.code === '200')) {
            resolve({
              success: true,
              captchaVerification,
            })
          }
          else {
            reject(new Error(innerRepMsg || (responseData as any).message || '验证失败'))
          }
        }
        else {
          reject(new Error('请求失败'))
        }
      },
      fail: (err) => {
        console.error('[Captcha] CHECK request failed:', err)
        reject(err)
      },
    })
  })
}
