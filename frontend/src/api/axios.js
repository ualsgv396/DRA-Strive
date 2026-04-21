import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de petición — añade el token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('strive_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuesta — si el token expira redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('strive_token')
      localStorage.removeItem('strive_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api