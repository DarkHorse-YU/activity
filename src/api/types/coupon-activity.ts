export type CouponActivityStatus = 'NOT_STARTED' | 'ONGOING' | 'ENDED'

export type CouponCodeStatus = 'unused' | 'used' | 'expired'

export interface ICouponActivityHomeRes {
  activityId?: number | string
  activityName?: string
  activityDesc?: string
  bannerUrl?: string
  startTime?: string
  endTime?: string
  status?: CouponActivityStatus | string
  [key: string]: any
}

export interface ICouponActivityRuleItem {
  id?: number | string
  title?: string
  content?: string
  sort?: number
  [key: string]: any
}

export interface ICouponCodeItem {
  id?: number | string
  title?: string
  code?: string
  expiresAt?: string
  status?: CouponCodeStatus | string
  receivedAt?: string
  usedAt?: string | null
  [key: string]: any
}

export interface IReceiveCouponReq {
  activityId?: number | string
  couponId?: number | string
  [key: string]: any
}
