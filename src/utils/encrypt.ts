import { JSEncrypt } from 'jsencrypt'

// RSA 公钥（与后端对应）
const publicKey
  = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAM51dgYtMyF+tTQt80sfFOpSV27a7t9u'
    + 'aUVeFrdGiVxscuizE7H8SMntYqfn9lp8a5GH5P1/GGehVjUD2gF/4kcCAwEAAQ=='

/**
 * RSA 加密
 * @param txt 需要加密的文本
 * @returns 加密后的字符串，加密失败返回 false
 */
export function encryptByRsa(txt: string): string | false {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  return encryptor.encrypt(txt)
}
