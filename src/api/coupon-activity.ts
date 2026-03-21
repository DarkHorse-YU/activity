import { http } from '@/http/http'

// 优惠券模板类型
export interface CouponTemplateItem {
  id: number | string
  activityId: number | string
  templateCode: string
  templateName: string
  description: string
  couponType: 'DISCOUNT' | 'CASH' // DISCOUNT=折扣券，CASH=满减券
  discountRate: number | null // 折扣率（如0.90表示九折）
  discountAmount: number // 减免金额
  thresholdAmount: number // 门槛金额（满X元可用）
  totalStock: number // 总库存
  claimedStock: number // 已抢数量
  remainingStock: number // 剩余数量
  perUserLimit: number // 单用户限领数量
  userClaimedCount: number // 用户已领数量
  formTemplateId: number | string // 券核销审核表单ID
  canClaim: boolean // 是否可领
  cannotClaimReason: string | null // 限领原因
  createdAt: string // 创建时间
}

// 获取优惠券模板列表
export function getCouponTemplates(activityId: number | string = 1) {
  return http.get<CouponTemplateItem[]>(`/coupon/user/activity/${activityId}/templates`)
}

export interface CouponActivityHomeRes {
  activityId?: number | string
  activityName?: string
  activityDesc?: string
  startTime?: string
  endTime?: string
  status?: string
  [key: string]: any
}

export interface CouponActivityRuleItem {
  id?: number | string
  title?: string
  content?: string
  sort?: number
  [key: string]: any
}

export interface CouponCodeItem {
  id: number | string // 用户券主键ID
  activityId: number | string // 活动ID
  activityName: string // 活动名称
  templateId: number | string // 活动券模板ID
  templateName: string // 活动券名称
  couponNo: string // 活动券编码
  qrToken: string // 活动券二维码
  couponType: 'DISCOUNT' | 'CASH' // 券类型：DISCOUNT=折扣券，CASH=满减券
  discountRate: number | null // 折扣率（如0.90表示九折）
  discountAmount: number // 减免金额
  thresholdAmount: number | null // 门槛金额（满X元可用）
  status: 'UNUSED' | 'APPROVED' | 'EXPIRED' | 'CANCELLED' // 状态
  statusDesc: string // 状态描述
  claimTime: string // 抢券时间
  validStartTime: string // 有效期开始
  validEndTime: string // 有效期结束时间
  writeOffId: number | string | null // 核销ID
  writeOffTime: string | null // 核销时间
  [key: string]: any
}

export function getCouponActivityHome<T = CouponActivityHomeRes>() {
  return http.get<T>('/activity/coupon/home')
}

export function getCouponActivityRules<T = CouponActivityRuleItem[]>() {
  return http.get<T>('/activity/coupon/rules')
}

export function getMyCouponCodes<T = CouponCodeItem[]>(activityId: number | string = 1) {
  return http.get<T>(`/coupon/user/my-coupons`, { activityId })
}

export function receiveCoupon<T = void>(data?: Record<string, any>) {
  return http.post<T>('/activity/coupon/receive', data)
}

// 领取优惠券请求参数
export interface ClaimCouponParams {
  templateId: number | string
  captchaVerification: string // 行为验证码二次校验参数
}

// 领取优惠券（带验证码）
export function claimCoupon(data: ClaimCouponParams) {
  return http.post<void>('/coupon/user/claim', data)
}
