import { useState } from "react"
import { Rooms } from "./Rooms"
import { MessageArea } from "./MessageArea"

export function ChatRoom(){
  const [roomkey, setRoomkey] = useState(["bdebbe8d-295f-43df-a3fe-d47629ca06b4", "Public Chat Room"]) // Public chat room
  function handleRoomkey(key){
    setRoomkey(key)
  }
  return(
  <>
    <div className="outside">
      <div className="container">
        <Rooms handleRoomkey={handleRoomkey} />
        <MessageArea roomkey={roomkey}/>
      </div>
    </div>
  </>
  )
}