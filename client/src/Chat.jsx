/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-key */
/* eslint-disable no-unused-vars */
import { useContext, useEffect, useRef, useState } from "react"
import Avatar from "./Avatar"
import { Logo } from "./Logo"
import { UserContext } from "./UserContext"
import { uniqBy } from "lodash"
import axios from "axios"
import Contact from "./Contact"


/* eslint-disable react/no-unknown-property */
export default function Chat(){
    const [ws,setWs]=useState(null)
    const [onlinePeople,setOnlinePeople]=useState({})
    const [selectedUserID,setSelectedUserId]=useState(null)
    const {username,id,setId,setUsername}=useContext(UserContext)
    const [newMessageText,setNewMessageText]=useState('')
    const [message,setMessage]=useState([])
    const [offlinePeople,setOfflinePeople]=useState({})
    const messagesBoxRef=useRef()
    const fullScreen=useRef()
    console.log ('selectes user id in global is:', selectedUserID);

    useEffect(()=>{
        console.log("In usee Effect")
        connectTows()
        // return ()=>{

        // }
    },[selectedUserID])
    function connectTows(){
        const ws = new WebSocket ('wss://chat-app-backend-ot16.onrender.com/');
        setWs (ws);
        console.log('in connection to ws')
        ws.addEventListener ('message', handleMessage)
        // ws.addEventListener('close',()=>{
        //     connectTows() 
        //     console.log('in close')
        // })
    }
    function showOnlinePeople(peopleArray){
        const people={}
        peopleArray.forEach(({userId,username}) => {
            people[userId]=username
        });
        // console.log(people)
        setOnlinePeople(people)
    }
    function handleMessage(e){
        console.log('selectes user id in handle messAGE IS:',   selectedUserID)
        // console.log('In handle message')
        const messageData=JSON.parse(e.data)
        // console.log(messageData)
        console.log('In handle message')
        console.log(messageData)
        if('online' in messageData){
            showOnlinePeople(messageData.online)
        }else if('text' in messageData){
            console.log("sender:",messageData.sender)
            console.log('selected user id:',selectedUserID)
            if(messageData.sender===selectedUserID){
                console.log("In current sender")
                setMessage (prev => [...prev, {...messageData}])
            }
        }
    }
    function sendMessage(ev,file){
        if(ev)ev.preventDefault ();
        ws.send(JSON.stringify({
            message:{
                recipient:selectedUserID,
                text:newMessageText,
                file,
            }
        }))
        
        if(file){
            axios.get ('/messages/' + selectedUserID).then (res => {
                const {data} = res;
                // console.log ('message is:', data);
                setMessage (data);
            })
        }else{
            setNewMessageText ('');
            setMessage (prev => [
                ...prev,
                {
                    text: newMessageText,
                    isOur: true,
                    sender: id,
                    recipient: selectedUserID,
                    _id: Date.now (),
                },
            ])
        }
    }
    function sendFile(ev){
        const reader=new FileReader()
        reader.readAsDataURL(ev.target.files[0])
        reader.onload=()=>{
            sendMessage(null,{
                name:ev.target.files[0].name,
                data:reader.result,
            })
        }
    }
    useEffect(()=>{
        const div = messagesBoxRef.current;
        if(div){
            div.scrollTop = div.scrollHeight;
        }
    },[message])
    useEffect(()=>{
        if(selectedUserID){
            axios.get ('/messages/' + selectedUserID).then(res=>{
                const {data}=res;
                // console.log("message is:",data)
                setMessage(data)
            })   
        }
    },[selectedUserID])
    useEffect(()=>{
        axios.get('/people').then(res=>{
            const offlinePeopleArr=res.data.filter(p=>p._id!=id).filter(p=>!Object.keys(onlinePeople).includes(p._id))
            const offlinePeople={}
            offlinePeopleArr.forEach(p=>{
                offlinePeople[p._id]=p;
            })
            setOfflinePeople(offlinePeople)
            // console.log(offlinePeople)
        })
    },[onlinePeople])
    const onlinePeopleExcludedUser={...onlinePeople}
    delete onlinePeopleExcludedUser[id]
    // console.log('message is:',message)
    const messagesWithoutDupes=uniqBy(message,'_id')

    // console.log('messagesWithoutDupes is:',messagesWithoutDupes)
    function logout(){
        axios.post('/logout').then(()=>{
            setWs(null)
            ws.close()
            setId(null)
            setUsername(null)
        })
    }
    function setSelectedUserIdMethod(userId){
        console.log('user id in method is:',userId)
        setSelectedUserId(userId)
    }
    console.log('opeu:',onlinePeopleExcludedUser)
    return (
        <div className="flex h-100vh">
            <div className="bg-white w-1/3 flex flex-col overflow-y-scroll h-screen">
                <div className="flex-grow">
                    <Logo />
                    {Object.keys (onlinePeopleExcludedUser).map (userId => (
                        <Contact
                        id={userId}
                        username={onlinePeopleExcludedUser[userId]}
                        onClick={() => {setSelectedUserIdMethod(userId)}}
                        selected={userId === selectedUserID}
                        online={true}
                        />
                    ))}
                    {Object.keys (offlinePeople).map (userId => (
                        <Contact
                        id={userId}
                        username={offlinePeople[userId].username}
                        onClick={() => setSelectedUserId (userId)}
                        selected={userId === selectedUserID}
                        online={false}
                        />
                    ))}
                </div>
                <div className="p-2 text-center flex items-center justify-center">
                    <span className="mr-2 text-sm text-gray-600 flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-4"
                            >
                            <path
                                fillRule="evenodd"
                                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {username}
                    </span>
                    <button className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm" onClick={logout}>logout</button>
                </div>
                
            </div>
            <div ref={fullScreen} className="flex flex-col h-screen bg-blue-50 w-2/3 p-2 ">
                <div className="flex-grow">
                    {!selectedUserID &&
                        (<div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-400">&larr; Select a person</div>
                        </div>)
                    }
                </div>
                {!!selectedUserID && (
                    <div className="relative h-full">
                        <div ref={messagesBoxRef} className="overflow-y-scroll absolute top-0 bottom-2 right-0 left-0">
                            {messagesWithoutDupes.map (message => (
                                <div key={message._id} className={`mx-2 ${message.sender === id ? 'text-right' : 'text-left'}`}>
                                <div
                                    className={`text-left inline-block ${message.sender == id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'} p-2 my-2 rounded-sm text-sm`}
                                >
                                    {message.text}
                                    {message.file && (
                                        <div>
                                            <a className='flex items-center gap-1 border-b' href={axios.defaults.baseURL+'/uploads/'+message.file}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    className="size-4"
                                                    >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                {message.file}
                                            </a>
                                        </div>
                                    )}
                                </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                )}
                {!!selectedUserID && (
                    <form className="flex gap-2" onSubmit={sendMessage}>
                        <input
                            type="text"
                            value={newMessageText}
                            onChange={ev => setNewMessageText (ev.target.value)}
                            placeholder="Type your message here"
                            className="bg-white border p-2 flex-grow rounded-sm"
                        />
                        <label className="bg-blue-200 p-2 text-gray-600 rounded-sm cursor-pointer border-blue-300">
                            <input type="file" className="hidden" onChange={sendFile}/>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="size-6"
                                >
                                <path
                                    fillRule="evenodd"
                                    d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </label>
                        <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                            <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                            >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                            />
                            </svg>
                        </button>
                    </form>
                )}
                
            </div>
        </div>
    )
}