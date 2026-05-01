import axios from 'axios'

// We can't import from AuthContext here (circular dep risk),
// so we expose a setter that App.jsx injects at startup.
let _logoutFn = null
export function setLogoutHandler(fn) { _logoutFn = fn }

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
})

// Re-export a helper that file_routes uses to attach the token
let _tokenGetter = null
export function setTokenGetter(fn) { _tokenGetter = fn }

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = _tokenGetter?.()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && _logoutFn) {
      _logoutFn()
    }
    return Promise.reject(err)
  }
)

export default api
