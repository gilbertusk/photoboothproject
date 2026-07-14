declare module 'gifshot' {
  interface GIFOptions {
    images: string[] | HTMLImageElement[]
    gifWidth?: number
    gifHeight?: number
    interval?: number
    numFrames?: number
    frameDuration?: number
    sampleInterval?: number
    numWorkers?: number
    filter?: string
    text?: string
    fontWeight?: string
    fontSize?: string
    fontFamily?: string
    fontColor?: string
    textAlign?: string
    textBaseline?: string
    watermark?: string
    watermarkHeight?: number
    watermarkWidth?: number
    watermarkX?: number
    watermarkY?: number
  }

  interface GIFResult {
    error: boolean
    errorCode?: string
    errorMsg?: string
    image: string
    cameraStream?: any
  }

  function createGIF(
    options: GIFOptions,
    callback: (result: GIFResult) => void
  ): void

  export default {
    createGIF,
  }
}
