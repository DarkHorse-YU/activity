import { check } from 'k6'
/* global __VU, __ITER */
import http from 'k6/http'

export const options = {
  scenarios: {
    claim_coupon: {
      executor: 'constant-arrival-rate',
      rate: 500,
      timeUnit: '1s',
      duration: '1s',
      preAllocatedVUs: 100,
      maxVUs: 800,
    },
  },
}

export default function () {
  // 纯数字不重复 userId
  const userId = __VU * 100000 + __ITER

  const payload = JSON.stringify({
    templateId: 1,
    userId,
  })

  const res = http.post(
    'http://124.221.55.156:18000/coupon/user/claim',
    payload,
    { headers: { 'Content-Type': 'application/json' } },
  )

  check(res, {
    状态码200: r => r.status === 200,
  })
}
