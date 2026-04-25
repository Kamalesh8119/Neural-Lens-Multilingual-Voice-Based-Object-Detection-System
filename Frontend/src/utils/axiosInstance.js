import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config
    const isAuthEndpoint = orig?.url?.startsWith('/auth/')
    const refreshToken = localStorage.getItem('refreshToken')

    if (err.response?.status === 401 && !orig._retry && refreshToken && !isAuthEndpoint) {
      orig._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh-token', { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        orig.headers.Authorization = `Bearer ${data.accessToken}`
        return api(orig)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
