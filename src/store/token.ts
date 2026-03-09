import type { AccountLoginReq, IAuthLoginRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  accountLogin as _accountLogin,
  logout as _logout,
  wxLogin as _wxLogin,
  getWxCode,
} from '@/api/login'
import { useUserStore } from './user'

// Token 存储 key
const TOKEN_KEY = 'token'

export const useTokenStore = defineStore(
  'token',
  () => {
    // Token 信息
    const token = ref(uni.getStorageSync(TOKEN_KEY) || '')

    /**
     * 设置 Token
     */
    const setToken = (val: string) => {
      token.value = val
      uni.setStorageSync(TOKEN_KEY, val)
    }

    /**
     * 清除 Token
     */
    const clearToken = () => {
      token.value = ''
      uni.removeStorageSync(TOKEN_KEY)
    }

    /**
     * 检查是否有登录信息
     */
    const hasLoginInfo = computed(() => !!token.value)

    /**
     * 检查是否已登录
     */
    const hasLogin = computed(() => !!token.value)

    /**
     * 获取有效的 Token
     */
    const validToken = computed(() => token.value)

    /**
     * 登录成功后处理逻辑
     */
    async function _postLogin(loginRes: IAuthLoginRes) {
      setToken(loginRes.token)
      const userStore = useUserStore()
      await userStore.fetchUserInfo()
    }

    /**
     * 账号登录
     */
    const accountLogin = async (req: AccountLoginReq) => {
      try {
        const res = await _accountLogin(req)
        console.log('账号登录-res: ', res)
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'error',
        })
        throw error
      }
    }

    /**
     * 微信登录
     */
    const wxLogin = async () => {
      try {
        // 获取微信小程序登录的code
        const loginRes = await getWxCode()
        console.log('微信登录-code: ', loginRes)
        const res = await _wxLogin({ code: loginRes.code })
        console.log('微信登录-res: ', res)
        await _postLogin(res)
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
        return res
      }
      catch (error) {
        console.error('微信登录失败:', error)
        uni.showToast({
          title: '微信登录失败，请重试',
          icon: 'error',
        })
        throw error
      }
    }

    /**
     * 退出登录
     */
    const logout = async () => {
      try {
        await _logout()
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        // 无论成功失败，都需要清除本地token信息
        clearToken()
        console.log('退出登录-清除用户信息')
        const userStore = useUserStore()
        userStore.clearUserInfo()
      }
    }

    return {
      // Token 状态
      token,
      setToken,
      clearToken,

      // 核心登录方法
      accountLogin,
      wxLogin,
      logout,

      // 认证状态判断
      hasLogin,
      hasLoginInfo,
      validToken,
    }
  },
  {
    persist: true,
  },
)
