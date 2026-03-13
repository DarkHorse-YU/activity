import { http } from '@/http/http'

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
  id?: number | string
  title?: string
  code?: string
  expiresAt?: string
  status?: string
  [key: string]: any
}

export function getCouponActivityHome<T = CouponActivityHomeRes>() {
  return http.get<T>('/activity/coupon/home')
}

export function getCouponActivityRules<T = CouponActivityRuleItem[]>() {
  return http.get<T>('/activity/coupon/rules')
}

export function getMyCouponCodes<T = CouponCodeItem[]>() {
  return http.get<T>('/activity/coupon/my-coupons')
}

export function receiveCoupon<T = void>(data?: Record<string, any>) {
  return http.post<T>('/activity/coupon/receive', data)
}
