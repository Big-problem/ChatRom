import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { storage, database } from "./firebase"
import { uploadBytesResumable, getDownloadURL, ref as stoRef } from "firebase/storage"
import { set, ref, serverTimestamp, update, push, child  } from "firebase/database";

export function SignUp() {
  const [usernameText, setUsernameText] = useState("")
  const [emailText, setEmailText] = useState("")
  const [passwordText, setPasswordText] = useState("")
  const [passwordConText, setPasswordConText] = useState("")
  const [loading, setLoading] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [wrongmessage, setWrongmessage] = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    const imagefile = e.target[4].files[0]
    setLoading(true)
    setWrong(false)
    setWrongmessage("")
    
    if(passwordText === passwordConText){
      try {
        // Sign up
        const auth = getAuth();
        const result = await createUserWithEmailAndPassword(auth, emailText, passwordText)
        alert("Sign up successfully! Please wait a few second for proper loading")
        // Upload profile image
        const storageRef = stoRef(storage, result.user.uid)
        const uploadTask = uploadBytesResumable(storageRef, imagefile)
        // Register observer
        uploadTask.on('state_changed', 
          () => {
          },
          (err) => {
            setWrong(true)
            setWrongmessage(err)
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then( async (downloadURL) => {
              await updateProfile(result.user, {
                displayName: usernameText,
                photoURL: downloadURL
              })
              // Save user info to database
              await set(ref(database, 'users/' + result.user.uid), {
                uid: result.user.uid,
                username: usernameText,
                email: emailText,
                photoURL: downloadURL
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
                message: usernameText + " Joined"
              }
              const newKey = push(child(ref(database), 'chats/bdebbe8d-295f-43df-a3fe-d47629ca06b4')).key;
              const updates = {}
              updates["/chats/bdebbe8d-295f-43df-a3fe-d47629ca06b4/" + newKey] = newMessage
      
              await update(ref(database), updates)
              navigate("/chatroom")
            })
          }
        )
      } catch (err) {
        setWrong(true)
        setWrongmessage(err)
        setLoading(false)
      }
    }
    else{
      setWrong(true)
      setWrongmessage({message: "Passwords do not match!"})
      setLoading(false)
    }
  }

  return(
    <>
    <div className="outside">
      <form className="new-form" onSubmit={handleSubmit}>
        <h1 className="title">Register</h1>
        { wrong && <div className="error">{wrongmessage.message}</div>}
        <div className="form-row smaller">
          <label htmlFor="username">User Name:</label>
          <input 
            type="text"
            id="username"
            className="form-input"
            value={usernameText}
            onChange={e => setUsernameText(e.target.value)}
            required/>
        </div>
        <div className="form-row smaller">
          <label htmlFor="email">Email:</label>
          <input 
            type="email"
            id="email"
            className="form-input"
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            required/>
        </div>
        <div className="form-row smaller">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={passwordText}
            onChange={e => setPasswordText(e.target.value)}
            required/>
        </div>
        <div className="form-row smaller">
          <label htmlFor="passwordConfirm">Password Confirm:</label>
          <input
            type="password"
            id="passwordConfirm"
            className="form-input"
            value={passwordConText}
            onChange={e => setPasswordConText(e.target.value)}
            required/>
        </div>
        <div className="form-row-image smaller">
          <label htmlFor="profileImage" className="uploadimage">Add profile picture</label>
          <input type="file" id="profileImage" accept="image/*" required/>
        </div>
        <button className="form-btn" disabled={loading}>Sign up</button>
        <p className="form-link">Already have an account? <Link to="/">Login Now</Link></p>
      </form>
      </div>
    </>
  )
}