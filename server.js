// import needed packages
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {
    Message,
    MessageInfo
} = require('./utils/message')
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getAllUsers,
    addMessageInfo,
    getMessages
} = require('./utils/users')
const { 
    addChatRoom, 
    allChatRooms, 
    joinChatRoom, 
    userExistInRoom, 
    addMessage, 
    getMessagesFromChatRoom,
    clearChatRooms
} = require('./utils/rooms')
const { 
    addFile, 
    getFile 
} = require('./utils/files')

// Create and initialize the socket
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

const botName = "Chatter"  // Server name

//client connecting ...
io.on('connection', socket => {
    console.log("Client connected")
    
    socket.on('joinApp', username => {
        // Add client to the system
        const user = userJoin(socket.id, username)  

        socket.emit("message", Message(botName, "Welcome to ChatApp!")) // If you want

        // Send online users this info
        io.emit("onlineUsers", {
            users: getAllUsers()
        })

        // And send rooms this info
        io.emit("newRoom", {
            rooms: allRooms()
        })
    })

    // Listen for chatMessage
    socket.on("chatMessage", ({ msg, targetClientId, type }) => {
        const user = getCurrentUser(socket.id)
        const target = getCurrentUser(targetClientId)
        // target client gets the message
        if(type === "text") {
            // Add message for both users
            addMessageInfo(MessageInfo(user.username, target.username, msg, "sended", type, 0))
            addMessageInfo(MessageInfo(target.username, user.username, msg, "received", type, 0))
        } else {    
            // if the message is not text then it is file
            let fileID = addFile(msg) 
            // Add file message for both users
            addMessageInfo(MessageInfo(user.username, target.username, msg.filename, "sended", type, fileID))
            addMessageInfo(MessageInfo(target.username, user.username, msg.filename, "received", type, fileID))
            // And send to the target
            io.to(targetClientId).emit("messages", {
                messages: getMessages(targetClientId)
            })

            // And send to client who is user
            io.to(user.id).emit("messages", {
                messages: getMessages(targetClientId)
            })
        }
        
        // Send all mesaages to target client
        io.to(targetClientId).emit("messages", {
            messages: getMessages(targetClientId)
        })
    })

    // Listen for messages
    socket.on("messages", (id) => {
        // and send them to client
        io.to(socket.id).emit("messages", {
            messages: getMessages(id)
        })
    })

    // Listen for new room
    socket.on("newRoom", roomname => {
        addRoom(roomname)
        // Send room information to all clients
        io.emit("newRoom", {
            rooms: allRooms()
        })
    })

    // Listen for any join action in the room
    socket.on("joinRoom", selectedRoomName => {
        let user = getCurrentUser(socket.id)
        let clientExist = userExistInRoom(selectedRoomName, user.username) // Check this client in room
        // If not exist
        if (!clientExist) {
            // join room
            joinRoom(user.username, selectedRoomName)
            socket.join(selectedRoomName)
            // Server sends message to joined client
            addMessage(selectedRoomName, Message(botName, "Welcome " + user.username, "text"))
        }
        // Send all messages in room to clients in room
        io.to(selectedRoomName).emit("chatRoom", {
            messages: getMessagesInRoom(selectedRoomName)
        })
    })

    // Listen for chat room
    socket.on("chatRoom", ({ selectedRoomName, username, msg, type }) => {
        if(type === "text")
            addMessage(selectedRoomName, MessageInfo(username, selectedRoomName, msg, "sended", type, 0))  // Add message to room
        else {
            let fileID = addFile(msg)
            // Add file messsage
            addMessage(selectedRoomName, MessageInfo(username, selectedRoomName, msg.filename, "sended", type, fileID))
        }
        // Send messages in chat room
        io.to(selectedRoomName).emit("chatRoom", {
            messages: getMessagesInRoom(selectedRoomName)
        })
    })
    
    // Listen for getFile
    socket.on("getFile", selectedFileID => {
        // Send file to target client
        let file = getFile(selectedFileID)
        console.log(file)
        io.to(socket.id).emit("getFile", {file: file.file})
    })


    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)   // Client leave from server
        if (user) {
            // Send online users
            io.emit("onlineUsers", {
                users: getAllUsers()
            })
        }
        console.log("disconnected: " + user.username)

        // If no client in app, delete all rooms
        if(getAllUsers().length == 0) clearRooms()
    })
})


const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))