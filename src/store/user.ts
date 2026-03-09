import type { IUserInfoRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getUserInfo } from '@/api/login'

// 初始化状态
const userInfoState: IUserInfoRes = {
  id: '',
  username: '',
  nickname: '',
  avatar: '/static/images/default-avatar.png',
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoRes>({ ...userInfoState })

    // 计算属性
    const nickname = computed(() => userInfo.value.nickname)
    const username = computed(() => userInfo.value.username)
    const avatar = computed(() => userInfo.value.avatar)
    const roles = computed(() => userInfo.value.roles || [])
    const permissions = computed(() => userInfo.value.permissions || [])

    // 设置用户信息
    const setUserInfo = (val: IUserInfoRes) => {
      console.log('设置用户信息', val)
      // 若头像为空 则使用默认头像
      if (!val.avatar) {
        val.avatar = userInfoState.avatar
      }
      userInfo.value = val
    }

    // 设置用户头像
    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar
      console.log('设置用户头像', avatar)
    }

    // 删除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('user')
    }

    // 获取用户信息
    const fetchUserInfo = async () => {
      const res = await getUserInfo()
      setUserInfo(res)
      return res
    }

    return {
      userInfo,
      nickname,
      username,
      avatar,
      roles,
      permissions,
      clearUserInfo,
      fetchUserInfo,
      setUserInfo,
      setUserAvatar,
    }
  },
  {
    persist: true,
  },
)
