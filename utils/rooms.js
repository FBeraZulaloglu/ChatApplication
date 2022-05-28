const rooms = [] // Store all rooms

function addChatRoom(roomname) {
    const room = { roomname, messages: [], users: [] }
    rooms.push(room)
    return rooms
}

function allChatRooms() {
    return rooms
}

function addMessage(roomname, message) {
    const index = rooms.findIndex(room => room.roomname === roomname)
    if (index !== -1) {
        rooms[index].messages.push(message)
    } else {
        rooms[0].messages.push(message)
    }
}

// Get all messages in the chat room
function getMessagesFromChatRoom(roomname) {
    const index = rooms.findIndex(room => room.roomname === roomname)
    return rooms[index].messages
}

// Client joins to the chat room
function joinChatRoom(username, roomname) {
    const index = rooms.findIndex(room => room.roomname === roomname)
    if (index !== -1) {
        rooms[index].users.push(username)
    } else {
        // ??
        rooms[0].users.push(username)
    }
}

// Check the client is in the chat room
function userExistInRoom(roomname, username) {
    const index = rooms.findIndex(room => room.roomname === roomname)
    if (index !== -1) {
        const i = rooms[index].users.findIndex(user => user === username)
        if (i !== -1) {
            return true
        }
    }

    return false
}

function clearChatRooms() {
    // removes array elements from 0. index
    rooms.splice(0, rooms.length)
}

module.exports = {
    addChatRoom,
    allChatRooms,
    addMessage,
    getMessagesFromChatRoom,
    joinChatRoom,
    userExistInRoom,
    clearChatRooms
}