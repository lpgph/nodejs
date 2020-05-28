import axios, {  AxiosError,AxiosResponse, AxiosPromise } from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 5000
})

export interface ResponsePromise<T=any> extends AxiosPromise<T>{

}

// request 拦截器
service.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    // Handle request error here
    Promise.reject(error)
  }
)
// response 拦截器
service.interceptors.response.use(
  (response) => {
    return response
  },
  // 返回状态码不为200时候的错误处理
  async(error:AxiosError) => {
    console.error(error)
    const response = error.response
    if (error && response) {
      switch (response.status) {
        case 400:
          error.message = '请求错误'
          break
        case 401:
          error.message = '未授权，请登录'
          break
        case 403:
          error.message = '拒绝访问'
          break
        case 404:
          error.message = `请求地址出错: ${response.config.url}`
          break
        case 408:
          error.message = '请求超时'
          break
        case 500:
          error.message = '服务器内部错误'
          break
        case 501:
          error.message = '服务未实现'
          break
        case 502:
          error.message = '网关错误'
          break
        case 503:
          error.message = '服务不可用'
          break
        case 504:
          error.message = '网关超时'
          break
        case 505:
          error.message = 'HTTP版本不受支持'
          break
        default:
      }
    }
    return Promise.reject(error)
  }
)

export default service
