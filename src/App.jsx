import './App.css'
import { RouterProvider } from 'react-router'
import { AuthProvider } from './context/AuthProvider'
import { router } from './routes/Routes'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App