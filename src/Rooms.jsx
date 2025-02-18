import { getAuth, signOut } from "firebase/auth"
import { useContext, useEffect, useState } from "react"
import { UserContext } from "./UserContext"
import { ref, serverTimestamp, child, push, update, onValue } from "firebase/database";
import { database } from "./firebase"
import { useNavigate } from "react-router-dom";

export function Rooms( {handleRoomkey} ) {
  const [loading, setLoading] = useState(false)
  const [userChats, setUserChats] = useState([])
  const currentUser = useContext(UserContext)
  const auth = getAuth()
  const navigate = useNavigate()
 
  async function logout(){
    try{
      setLoading(true)
      await signOut(auth)
      alert("Logged out successfully!")
      navigate("/")
    }
    catch (err){
      console.log(err)
    }
    setLoading(false)
  }

  async function newChatRoom(){
    const roomName = window.prompt('Please name the chat room:')
    if(roomName){
      try {
        const chatRoomData = {
          date: serverTimestamp(),
          roomName: roomName,
          latestMessage: ""
        }
        const chatsData = {
          date: serverTimestamp(),
          message: currentUser.displayName + " Created",
          sender: "SYSTEM192837465",
        }

        // Get a key
        const newKey = push(child(ref(database), 'userChats')).key
        const newKey2 = push(child(ref(database), 'chats/' + newKey)).key;

        const updates = {}
        updates['/userChats/' + currentUser.uid + '/' + newKey] = chatRoomData
        updates['/chats/' + newKey + '/' + newKey2] = chatsData

        await update(ref(database), updates)
      } catch (error) {
        alert("We are sorry, something went wrong")
      }
    }
  }

  useEffect(() => {
    const dbRef = ref(database, 'userChats/' + currentUser.uid)
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setUserChats(preval => {
        if((Object.keys(preval).length === Object.keys(snapshot.val()).length-1) && Object.keys(preval).length > 0){
          console.log(Object.entries(snapshot.val()).sort((a, b) => b[1].date-a[1].date)[0][1].roomName)
          Notification.requestPermission().then(perm => {
            if(perm === 'granted'){
              new Notification("New ChatRoom", {
                body: `You have joined ${Object.entries(snapshot.val()).sort((a, b) => b[1].date-a[1].date)[0][1].roomName}`,
              })
            }
          })
        }

        return snapshot.val()
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])


  return (currentUser && 
  <div className="rooms">
    <div className="user-info">
      <span className="logo">ChatterBox</span>
      <div className="user-log">
        <img className="profile-picture" src={currentUser.photoURL} alt="Profile Picture" />
        <span>{currentUser.displayName}</span>
      </div>
    </div>
    <div className="room-containter">
      {userChats && Object.entries(userChats).sort((a, b) => b[1].date-a[1].date).map(userchat => {
        return (
          <div className="room" key={userchat[0]} onClick={() => handleRoomkey([userchat[0], userchat[1].roomName])}>
            <span>{userchat[1].roomName}</span>
            <p>{userchat[1].latestMessage}</p>
          </div>
        )
      })}
      <div className="add-chatroom-logout">
        <button className="add-chatroom-btn" onClick={newChatRoom}>New ChatRoom</button>
        <button className="logoutbtn" onClick={logout} disabled={loading}>Logout</button>
      </div>
    </div>
  </div>
  )
}
