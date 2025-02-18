import { createContext, useState, useEffect } from "react";
import {getAuth, onAuthStateChanged} from "firebase/auth";
export const UserContext = createContext()

export function UserProvider({children}){
	const [currentUser, setCurrentUser] = useState()
	useEffect(() => {
		const auth = getAuth()
		const unsubscribe = onAuthStateChanged(auth, user => {
			setCurrentUser(user)
		})
		return () => {
			unsubscribe()
		}
	}, [])

	return(
		<UserContext.Provider value={currentUser}>
			{children}
		</UserContext.Provider>
	)
}