import type {
  AccountLoginReq,
  EmailLoginReq,
  IAuthLoginRes,
  ICaptcha,
  IUpdateInfo,
  IUpdatePassword,
  IUserInfoRes,
  PhoneLoginReq,
} from './types/login'
import { http } from '@/http/http'
import { AuthTypeConstants } from './types/login'

const BASE_URL = '/auth'

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCaptcha() {
  return http.get<ICaptcha>('/captcha/image')
}

/**
 * 账号登录
 * @param req 登录请求参数
 */
export function accountLogin(req: AccountLoginReq) {
  return http.post<IAuthLoginRes>(`${BASE_URL}/login`, {
    ...req,
    clientId: import.meta.env.VITE_CLIENT_ID,
    authType: AuthTypeConstants.ACCOUNT,
  })
}

/**
 * 手机号登录
 * @param req 登录请求参数
 */
export function phoneLogin(req: PhoneLoginReq) {
  return http.post<IAuthLoginRes>(`${BASE_URL}/login`, {
    ...req,
    clientId: import.meta.env.VITE_CLIENT_ID,
    authType: AuthTypeConstants.PHONE,
  })
}

/**
 * 邮箱登录
 * @param req 登录请求参数
 */
export function emailLogin(req: EmailLoginReq) {
  return http.post<IAuthLoginRes>(`${BASE_URL}/login`, {
    ...req,
    clientId: import.meta.env.VITE_CLIENT_ID,
    authType: AuthTypeConstants.EMAIL,
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<IUserInfoRes>(`${BASE_URL}/user/info`)
}

/**
 * 退出登录
 */
export function logout() {
  return http.post<void>(`${BASE_URL}/logout`)
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IAuthLoginRes>(`${BASE_URL}/login`, {
    ...data,
    clientId: import.meta.env.VITE_CLIENT_ID,
    authType: AuthTypeConstants.SOCIAL,
    source: 'wechat_mini',
  })
}
