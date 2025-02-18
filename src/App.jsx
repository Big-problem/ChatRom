import { useContext } from 'react'
import { Login } from './Login'
import { SignUp } from './SignUp'
import { ChatRoom } from './ChatRoom'
import { UserContext } from './UserContext'
import { Route, Routes } from "react-router-dom"
import { app } from "./firebase"

function App() {
  const currentUser = useContext(UserContext)

  return (
    <>
      <Routes>
        <Route path='/' element={<Login />}/>
        <Route path='/signup' element={<SignUp />} />
        <Route path='/chatroom' element={currentUser ? <ChatRoom /> : <Login />}/>
      </Routes>
    </>
  )
}

export default App
