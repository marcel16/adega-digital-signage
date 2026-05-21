import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("@adega:token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem("@adega:refreshToken")
        if (refreshToken) {
          const { data } = await axios.post("/api/auth/refresh", { refreshToken })
          localStorage.setItem("@adega:token", data.token)
          localStorage.setItem("@adega:refreshToken", data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.token}`
          return api(originalRequest)
        }
      } catch {
        localStorage.removeItem("@adega:token")
        localStorage.removeItem("@adega:refreshToken")
        localStorage.removeItem("@adega:user")
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
