export interface ISubsidyFileUploadReq {
  file: File
  needOcr: boolean
  ocrMappingKey?: string | null
}

export interface IOcrResult {
  [key: string]: string
}

export interface ISubsidyFileUploadRes {
  subsidyFileId: number
  url: string
  thUrl: string
  ocrResult?: IOcrResult
}
