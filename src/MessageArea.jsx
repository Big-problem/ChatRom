import { useContext, useState, useEffect, useRef } from "react"
import { UserContext } from "./UserContext"
import { database, storage } from "./firebase"
import { onValue, ref, update, serverTimestamp, push, child, set } from "firebase/database"
import { uploadBytesResumable, getDownloadURL, ref as stoRef } from "firebase/storage"

export function MessageArea({ roomkey }){
  const [messageText, setMeaasgeText] = useState("")
  const [chatRecords, setChatRecords] = useState([])
  const dummy = useRef()
  const currentUser = useContext(UserContext)  
   
  function scrollDown(){
    dummy.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start'})
  }

  async function handleAddUser() { // 新增成員
    const newUser = window.prompt('Please enter the email:')
    if(newUser){
      const dbRef = ref(database, 'users')
      onValue(dbRef, async (snapshot) => {
        const data = snapshot.val()
        let userid = ""
        let userName = ""
        
        Object.entries(data).map(dd => { // 檢差輸入的email是否存在
          if(dd[1].email === newUser){
            userid = dd[0]
            userName = dd[1].username
            let alreadyIn = false
            const dbRef2 = ref(database, 'userChats/' + userid)
            onValue(dbRef2, async (snapshot) => { // 檢查該使用者是否已經加入聊天室
              const data2 = snapshot.val()
              Object.entries(data2).map(dd2 => {
                if(dd2[0] === roomkey[0]) alreadyIn = true
              })
              if(alreadyIn) alert("User already in the chat room")
              else{ 
                // Add user to the chat room (change userChats database)
                try {
                  const chatRoomData = {
                    date: serverTimestamp(),
                    roomName: roomkey[1],
                    latestMessage: ""
                  }
                  const newMessage = {
                    date: serverTimestamp(),
                    sender: "SYSTEM192837465",
                    message: userName + " Joined"
                  }
                  const newKey = push(child(ref(database), 'chats/' + roomkey[0])).key;
                  const updates = {}
                  updates['/userChats/' + userid + '/' + roomkey[0]] = chatRoomData
                  updates["/chats/" + roomkey[0] + "/" + newKey] = newMessage
          
                  await update(ref(database), updates)
                } catch (error) {
                  alert("We are sorry, something went wrong 400")
                }
              }
            }, {
              onlyOnce: true
            })
          }
        })
        if(!userid){
          alert("User does not exist!")
        }
      }, {
        onlyOnce: true
      })
    } 
  }

  function handleSubmitPhoto(e){
    const imagefile = e.target.files[0]
    try {
      // DATABASE
      const newKey = push(child(ref(database), 'chats/' + roomkey[0])).key;
      
      // STORAGE
      // Upload profile image
      const storageRef = stoRef(storage, newKey)
      const uploadTask = uploadBytesResumable(storageRef, imagefile)
      // Register observer
      uploadTask.on('state_changed', 
        () => {
        },
        (err) => {
          console.log(err)
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then( async (downloadURL) => {
            const newMessage = {
              date: serverTimestamp(),
              sender: currentUser.uid,
              senderName: currentUser.displayName,
              profilePicture: currentUser.photoURL,
              message: "L5p3-PHOTO-ize3",
              photoURL: downloadURL
            }
            const updates = {}
            updates["/chats/" + roomkey[0] + "/" + newKey] = newMessage
            await update(ref(database), updates)

            scrollDown()
            
            // Loop all userChats, if they joined this chat room, update the date and latest message
            const dbRef = ref(database, 'userChats/')
            onValue(dbRef, async (snapshot) => {
              const userDatas = snapshot.val()
              Object.entries(userDatas).map(userData => {
                Object.entries(userData[1]).map(async ud => {
                  if(ud[0] === roomkey[0]){
                    const newMessage2 = {
                      date: newMessage.date,
                      roomName: roomkey[1],
                      latestMessage: "**Photo has sent**"
                    }

                    const updates2 = {}
                    updates2["/userChats/" + userData[0] + "/" + roomkey[0]] = newMessage2
                    await update(ref(database), updates2)
                  }
                })
              })

              
            }, {
              onlyOnce: true
            })

          })
        }
      )
    } catch (err) {
      console.log(err)
    }
    e.target.value = ''
  }

  async function sendMessage(){
    if(messageText){
      try {
        // Update chats database
        const newMessage = {
          date: serverTimestamp(),
          sender: currentUser.uid,
          senderName: currentUser.displayName,
          profilePicture: currentUser.photoURL,
          message: messageText
        }
        const newKey = push(child(ref(database), 'chats/' + roomkey[0])).key;

        const updates = {}
        updates["/chats/" + roomkey[0] + "/" + newKey] = newMessage
        await update(ref(database), updates)

        scrollDown()

        // Loop all userChats, if they joined this chat room, update the date and latest message
        const dbRef = ref(database, 'userChats/')
        onValue(dbRef, async (snapshot) => {
          const userDatas = snapshot.val()
          Object.entries(userDatas).map(userData => {
            Object.entries(userData[1]).map(async ud => {
              if(ud[0] === roomkey[0]){
                const newMessage2 = {
                  date: newMessage.date,
                  roomName: roomkey[1],
                  latestMessage: messageText
                }
                const updates2 = {}
                updates2["/userChats/" + userData[0] + "/" + roomkey[0]] = newMessage2
                await update(ref(database), updates2)
              }
            })
          })

          
        }, {
          onlyOnce: true
        })


        setMeaasgeText("")
      } catch (error) {
        alert(error)
      }
    }
  }

  async function clearText(id){
    const dbRef = ref(database, 'chats/' + roomkey[0])
    onValue(dbRef, async (snapshot) => {
      const chats = Object.entries(snapshot.val())
      let lastmessage = ""
      let newDate = chats[0][1].date
      if(chats[chats.length-1][0] === id){
        let i = chats.length-2
        for(; i >= 0; i -= 1){
          if(chats[i][1].sender !== "SYSTEM192837465"){
            if(chats[i][1].message === "L5p3-PHOTO-ize3") lastmessage = "**Photo has sent**"
            else lastmessage = chats[i][1].message
            newDate = chats[i][1].date
            break
          }
        }

        // Loop all userChats, if they joined this chat room, update the date and latest message
        const dbRef2 = ref(database, 'userChats/')
        onValue(dbRef2, async (snapshot) => {
          const userDatas = snapshot.val()
          Object.entries(userDatas).map(userData => {
            Object.entries(userData[1]).map(async ud => {
              if(ud[0] === roomkey[0]){
                const newMessage2 = {
                  date: newDate,
                  roomName: roomkey[1],
                  latestMessage: lastmessage
                }
                const updates2 = {}
                updates2["/userChats/" + userData[0] + "/" + roomkey[0]] = newMessage2
                await update(ref(database), updates2)
              }
            })
          })

          
        }, {
          onlyOnce: true
        })





      }
    }, {
      onlyOnce: true
    })
    await set(ref(database, 'chats/' + roomkey[0] + '/' + id), {})
  }

  useEffect(() => {
    const dbRef = ref(database, 'chats/' + roomkey[0])
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setChatRecords(snapshot.val())
    })
    return () => {
      unsubscribe()
    }
  }, [roomkey])

  return(
    <div className="message-area">
      <div className="chatroom-name">
        <p>{roomkey[1]}</p>
        <button className="add-user-btn" onClick={handleAddUser}>Add User</button>
      </div>
      <div className="message-main">
    
        {chatRecords && Object.entries(chatRecords).map(chatRecord => {
          if(chatRecord[1].sender === "SYSTEM192837465"){
            return (
              <div className="system-message" key={chatRecord[0]}>
                <span>{chatRecord[1].message}</span>
              </div>
            )
          }
          else if(chatRecord[1].sender === currentUser.uid){
            if(chatRecord[1].message === "L5p3-PHOTO-ize3"){
              return (
                <div className="message-mine" key={chatRecord[0]}>
                  <div className="name-message">
                    <p className="show-name">{chatRecord[1].senderName}</p>
                    <img className="message-photo" src={chatRecord[1].photoURL} alt="" />
                    <button className="clear-text2" onClick={() => clearText(chatRecord[0])}>
                      <span className="material-symbols-outlined cancel">cancel</span>
                    </button>
                  </div>
                  <img className="profile-picture" src={chatRecord[1].profilePicture} alt="Profile Picture" />
                </div>    
              )
            }
            else{
              return (
                <div className="message-mine" key={chatRecord[0]}>
                  <div className="name-message">
                    <p className="show-name">{chatRecord[1].senderName}</p>
                    <div className="my-message-itself">
                      {chatRecord[1].message}
                      <button className="clear-text" onClick={() => clearText(chatRecord[0])}>
                        <span className="material-symbols-outlined cancel">cancel</span>
                      </button>
                    </div>
                  </div>
                  <img className="profile-picture" src={chatRecord[1].profilePicture} alt="Profile Picture" />
                </div>    
              )
            }
          }
          else{
            if(chatRecord[1].message === "L5p3-PHOTO-ize3"){
              return (
                <div className="message" key={chatRecord[0]}>
                  <img className="profile-picture" src={chatRecord[1].profilePicture} alt="Profile Picture" />
                  <div className="name-other-message">
                    <p className="show-other-name">{chatRecord[1].senderName}</p>
                    <img className="message-photo" src={chatRecord[1].photoURL} alt="" />
                  </div>
                </div>     
              )
            }
            else{
              return (
                <div className="message" key={chatRecord[0]}>
                  <img className="profile-picture" src={chatRecord[1].profilePicture} alt="Profile Picture" />
                  <div className="name-other-message">
                    <p className="show-other-name">{chatRecord[1].senderName}</p>
                    <p className="message-itself">{chatRecord[1].message}</p>
                  </div>
                </div>    
              )
            }
          }
        })}
        <div ref={dummy}></div>
        <button className="bottom-btn" onClick={scrollDown}>
          <span className="material-symbols-outlined">arrow_downward</span>
        </button>
      </div>
      <div className="message-input">
        <input
          type="text"
          className="text-input"
          placeholder="Typing..."
          value={messageText}
          onChange={e => setMeaasgeText(e.target.value)}
        />
        <label htmlFor="add-photo" className="lab1">
          <span className="material-symbols-outlined">add_photo_alternate</span>
        </label>
        <input type="file" id="add-photo" className="add-photo-input" onChange={e => handleSubmitPhoto(e)} accept="image/*" />
        <button className="message-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}