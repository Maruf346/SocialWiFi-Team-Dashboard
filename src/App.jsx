import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { RouterProvider } from 'react-router'
import { router } from './routes/Routes'

function App() {
 

  return (
    <>
     <RouterProvider router={router} />
    </>
  )
}

export default App
