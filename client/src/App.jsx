import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { Home } from "./pages/home/Home"
import { Login } from "./pages/login/Login"
import { Owner } from "./pages/owner/Owner"
import { CreateExpense } from "./pages/createExpense/CreateExpense"
import { CreateOrder } from "./pages/createOrder/CreateOrder"
import { Customers } from "./pages/customers/Customers"
import { Customer } from "./pages/customer/Customer"
import { OrderDetails } from "./pages/orderDetails/OrderDetails"
import { ExpenseDetails } from "./pages/expenseDetails/ExpenseDetails"

function App() {
  const [isAuth, setIsAuth] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState(null)
  const [fullname, setFullname] = useState(null)

  const axiosBaseUrl = "http://192.168.31.232:8000/server"

  axios.defaults.baseURL = axiosBaseUrl

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token")
          setIsAuth(false)
          window.location.href = "/login"
        }
        return Promise.reject(error)
      },
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")

      if (!token || token.trim() === "") {
        setIsAuth(false)
        setIsAdmin(false)
        setUsername(null)
        setFullname(null)
        setLoading(false)
        return
      }

      try {
        const parts = token.split(".")
        if (parts.length !== 3) throw new Error("Invalid token")

        const payload = JSON.parse(atob(parts[1]))
        const isValid = payload.exp * 1000 > Date.now() - 60000
        setIsAuth(isValid)
        setIsAdmin(!!payload.isAdmin)
        setUsername(payload.username || null)
        setFullname(`${payload.firstname} ${payload.lastname}` || null)

        if (!isValid) localStorage.removeItem("token")
      } catch (error) {
        console.error("Token validation error:", error)
        localStorage.removeItem("token")
        setIsAuth(false)
        setIsAdmin(false)
        setUsername(null)
        setFullname(null)
      }
      setLoading(false)
    }

    checkAuth()

    const interval = setInterval(checkAuth, 5000)

    const handleTokenChange = () => checkAuth()
    window.addEventListener("storage", handleTokenChange)
    window.addEventListener("tokenChanged", handleTokenChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleTokenChange)
      window.removeEventListener("tokenChanged", handleTokenChange)
    }
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          fontSize: "18px",
          fontFamily: "Poppins",
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuth ? (
              <Navigate to="/" replace />
            ) : (
              <Login setIsAuth={setIsAuth} />
            )
          }
        />

        <Route
          path="/"
          element={
            isAuth ? (
              <Home
                setIsAuth={setIsAuth}
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
                username={username}
                setUsername={setUsername}
                fullname={fullname}
                setFullname={setFullname}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/owner"
          element={
            isAuth && isAdmin ? (
              <Owner
               setIsAuth={setIsAuth}
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
                username={username}
                setUsername={setUsername}
                fullname={fullname}
                setFullname={setFullname}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/create-order/:orderId?"
          element={
            isAuth ? (
              <CreateOrder />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/order/:id"
          element={
            isAuth ? (
              <OrderDetails />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/expense/:id"
          element={
            isAuth ? (
              <ExpenseDetails />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/customers"
          element={
            isAuth ? (
              <Customers />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/customers/:id"
          element={
            isAuth ? (
              <Customer />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/owner/create-expense/:expenseId?"
          element={
            isAuth && isAdmin ? (
              <CreateExpense />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
