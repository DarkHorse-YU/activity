// 认证模式类型
export type AuthMode = 'single' | 'double'

// 认证类型
export type AuthType = 'ACCOUNT' | 'PHONE' | 'EMAIL' | 'SOCIAL'

export const AuthTypeConstants = {
  ACCOUNT: 'ACCOUNT',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  SOCIAL: 'SOCIAL',
} as const

// 基础认证请求接口
export interface AuthReq {
  clientId?: string
  authType?: AuthType
}

// 账号登录请求参数
export interface AccountLoginReq extends AuthReq {
  username: string
  password: string
  captcha: string
  uuid: string
}

// 手机号登录请求参数
export interface PhoneLoginReq extends AuthReq {
  phone: string
  captcha: string
}

// 邮箱登录请求参数
export interface EmailLoginReq extends AuthReq {
  email: string
  captcha: string
}

// 登录响应类型
export interface IAuthLoginRes {
  token: string
  tenantId: string
}

/**
 * 用户信息
 */
export type UserRole = string

export interface IUserInfoRes {
  id: string
  username: string
  nickname: string
  avatar?: string
  gender?: 0 | 1 | 2
  email?: string
  phone?: string
  deptName?: string
  /** 同时支持单角色和多角色 */
  roles?: UserRole[]
  roleNames?: string[]
  permissions?: string[]
  [key: string]: any // 允许其他扩展字段
}

/**
 * 获取验证码响应
 */
export interface ICaptcha {
  uuid: string
  img: string
  expireTime: number
  /** 验证码是否启用，兼容多种字段名 */
  isEnabled?: boolean
  enabled?: boolean
  captchaEnabled?: boolean
}

/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}

/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}

/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * 补贴申报上传文件请求参数
 */
export interface ISubsidyFileUploadReq {
  file: File
  needOcr: boolean
  ocrMappingKey?: string | null
}

/**
 * OCR识别结果
 */
export interface IOcrResult {
  [key: string]: string
}

/**
 * 补贴申报上传文件响应
 */
export interface ISubsidyFileUploadRes {
  subsidyFileId: number
  url: string
  thUrl: string
  ocrResult?: IOcrResult
}
