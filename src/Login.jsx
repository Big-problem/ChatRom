import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { onValue, set, ref, serverTimestamp, update, push, child  } from "firebase/database"
import { database } from "./firebase"

export function Login() {
  const [emailText, setEmailText] = useState("")
  const [passwordText, setPasswordText] = useState("")
  const [loading, setLoading] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [wrongmessage, setWrongmessage] = useState("")
  const navigate = useNavigate()
  const provider = new GoogleAuthProvider()

  async function handleSubmit(e){
    e.preventDefault()
    setWrong(false)
    setWrongmessage("")

    try {
      const auth = getAuth()
      setLoading(true)
      await signInWithEmailAndPassword(auth, emailText, passwordText)
      alert("Welcome back!")
      navigate("/chatroom")
    } catch (error) {
      setWrong(true)
      setWrongmessage(error.message)
      setLoading(false)
    }
  }

  async function handleGoogle(){
    try {
      const auth = getAuth()
      const result = await signInWithPopup(auth, provider)
      let alreadyIn = false
      const dbRef = ref(database, 'users')
      onValue(dbRef, async (snapshot) => { // 檢查該使用者是否已經加入聊天室
        const datas = snapshot.val()
        if(datas){
          Object.entries(datas).map(data => {
            if(data[0] === result.user.uid) alreadyIn = true
          })
        }
        if(!alreadyIn){ // 沒登入過, 做跟sign in一樣的事
          // Save user info to database
          await set(ref(database, 'users/' + result.user.uid), {
            uid: result.user.uid,
            username: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL
          })

          // Add the user in to public chat room
          await set(ref(database, 'userChats/' + result.user.uid), {
            "bdebbe8d-295f-43df-a3fe-d47629ca06b4": {
              roomName: "Public Chat Room",
              date: serverTimestamp(),
              latestMessage: ""
            }
          })

          // Add new user message in public chat room
          const newMessage = {
            date: serverTimestamp(),
            sender: "SYSTEM192837465",
            message: result.user.displayName + " Joined"
          }
          const newKey = push(child(ref(database), 'chats/bdebbe8d-295f-43df-a3fe-d47629ca06b4')).key;
          const updates = {}
          updates["/chats/bdebbe8d-295f-43df-a3fe-d47629ca06b4/" + newKey] = newMessage

          await update(ref(database), updates)
          alert("Welcome back!")
          navigate("/chatroom")
        }
      }, {
        onlyOnce: true
      })
    } catch (error) {
      setLoading(false)
    }
    
  }

  return(
    <>
    <div className="outside">
      <form className="new-form" onSubmit={handleSubmit}>
        <h1 className="title">ChatterBox</h1>
        { wrong && <div className="error">{wrongmessage}</div>}
        <div className="form-row">
          <label htmlFor="email">Email:</label>
          <input
          type="email"
          id="email"
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          className="form-input"
          required/>
        </div>
        <div className="form-row">
          <label htmlFor="password">Password:</label>
          <input
          type="password"
          id="password"
          value={passwordText}
          onChange={(e) => setPasswordText(e.target.value)}
          className="form-input"
          required/>
        </div>
        <button className="form-btn" disabled={loading}>Login</button>
        <button className="form-btn" type="button" onClick={handleGoogle} disabled={loading}>Google Login</button>
        <p className="form-link">Need an account? <Link to="/signup">Sign Up</Link></p>
      </form>
      </div>
    </>
  )
}