const Message = require("../models/Message");
const Room = require("../models/Room");
const express = require('express');
const http = require("http");
const app = express();
const server = http.createServer(app);
const moment = require('moment');
const { findMessages } = require("./message_utils");
const { createNotification } = require("./notification_utils");
const { getUserIDFromToken } = require("./token_utils");
const { findUser } = require("./user_utils");
const webPush = require("./push_utils/index");
const { findDoc, updateDoc } = require("./doc_utils");
const { imagekit } = require("./imageKit");
const ONLINE_USERS = [];
const ONLINE_PUBLIC_CODE_USERS = [];
const ONLINE_COLLAB_USERS = []

const io = require("socket.io")(server, {
    cors: {
        origin: process.env.FE_ORIGIN,
        methods: ["GET", "POST"],
    },
})
const editorIO = io.of("/editor1")
const chatIO = io.of("/chat");
const publicIO = io.of("/public");

const doSockets = () => {
    /// Landing page editor
    publicIO.on("connection", socket => {
        console.log("public con")
        socket.on("join-editor", () => {
            socket.join("public-room");
            socket.on("send-changes", ({ data, value, randID }) => {
                socket.broadcast.to("public-room").emit("receive-changes", { data, value, sender_id: randID })
            })
        })
    })


    /// Chats
    chatIO.adapter.on("create-room", (room) => {
        console.log(`room ${room} was created`);
    });

    chatIO.adapter.on("join-room", (room, id) => {
        console.log(`socket ${id} has joined room ${room}`);
    });
    chatIO.on('connect_error', error => {
        // TODO: send error
        console.log(error)
    })

    chatIO.on("connection", socket => {
        console.log("connected")
        socket.on("join-chat", async ({ name }) => {
            if (socket.handshake.auth.token) {
                getUserIDFromToken(socket.handshake.auth.token, async ({ found, user_id }) => {
                    if (found) {
                        const { found, user: idUser } = await findUser({ _id: user_id });
                        if (idUser.isVerified === false) {
                            return socket.emit("error_happened", "Your account has not been verified.");
                        }
                        socket.userID = user_id;
                        socket.currentUser = idUser
                        const { found: foundNameUser, user: nameUser } = await findUser({ username: name });
                        if (foundNameUser) {
                            if (found) {
                                if (nameUser.username === idUser.username) return socket.emit("error_happened", "You cannot chat with yourself.")
                                let roomID = genRoomID(nameUser.username, idUser.username);
                                const roomF = await Room.findOne({ roomID: roomID });
                                const { found: foundMessages, messages } = await findMessages({ room: roomID });
                                if (roomID) {

                                    if (roomF) {
                                        userJoin(socket.userID, idUser.username, roomID, socket.id);
                                        socket.join(roomID);
                                        chatIO.to(roomID)
                                            .emit(
                                                'onlineUsers', {
                                                room: roomID,
                                                users: getRoomUsers(roomID)
                                            }
                                            );
                                        console.log('ran')
                                        if (foundMessages) {
                                            socket.emit("load-messages", { messages, success: true, roomID, userID: socket.userID, profileImage: nameUser.profileImageUrl, profileImageYou: idUser.profileImageUrl, notYouID: nameUser._id });
                                        } else {
                                            socket.emit("load-messages", { success: false, roomID, userID: socket.userID });
                                        }
                                    } else {
                                        console.log("here");
                                        await Room.create({
                                            roomID,
                                            participants: [{ user: idUser._id }, { user: nameUser._id }]
                                        });
                                        userJoin(socket.userID, idUser.username, roomID, socket.id);
                                        socket.join(roomID);

                                        chatIO.to(roomID).emit(
                                            'onlineUsers', {
                                            room: roomID,
                                            users: getRoomUsers(roomID)
                                        }
                                        );
                                        if (foundMessages) {
                                            socket.emit("load-messages", { messages, success: true, roomID, userID: socket.userID, profileImage: nameUser.profileImageUrl, profileImageYou: idUser.profileImageUrl, notYouID: nameUser._id });
                                        } else {
                                            socket.emit("load-messages", { success: false, roomID, userID: socket.userID });
                                        }
                                    }


                                }
                            } else {
                                socket.emit("error_happened", "You are not signed in.")
                            }
                        } else {
                            socket.emit("error_happened", "The user you want to chat with does not exist.")
                        }

                    } else {
                        socket.emit("error_happened", "Your session has expired please login.")
                    }
                });


            } else {
                socket.emit("error_happened", "You are not authenticated.")
            }
        });
        /// Typing event 
        socket.on("typing", () => {
            const user = getCurrentUser(socket.id);
            socket.broadcast.to(user?.room).emit('typing', `${user?.username} is typing.`);
        });
        socket.on("onlineUsers", () => {
            const user = getCurrentUser(socket.id);
            console.log(user);
            if (user) {
                chatIO.to(user?.room).emit('onlineUsers', {
                    room: user?.room,
                    users: getRoomUsers(user?.room)
                });
            }
        });
        // Listen for chatMessage
        socket.on('message', async ({ msg }) => {
            const user = getCurrentUser(socket.id);
            chatIO.to(user?.room).emit('message', formatMessage(user && user.username, msg, user?.id));

            if (user) {
                await Message.create({
                    room: user.room,
                    body: msg,
                    user: user.id,
                    type: "message"
                });
                const room = await Room.findOne({ roomID: user?.room }).populate("participants.user").select("profileImageUrl username")
                const participants = room?.participants;
                const notUser = participants.filter(u => u.user._id != user.id)[0];
                console.log(notUser);
                const payload = JSON.stringify({
                    title: `New message from ${user.username}`,
                    body: msg,
                    image: socket.currentUser.profileImageUrl
                });
                if (!notUser) return;

                webPush.sendNotification(notUser?.user?.sub, payload)
                    .then(result => console.log(result))
                    .catch(e => console.log(e.stack))
                await createNotification(notUser?.user?._id, `New message from ${user?.username}.`, user?.id);


            }

        });
        /// Listen for voice notes 
        socket.on("vn", async ({ audiob64, room: roomInUse, idUserProfileImage, id, userID }) => {
            imagekit.upload({
                file: audiob64,
                fileName: "audio_from_live_gists.webm",   //required
            }, async function (error, result) {
                console.log('ran');
                if (error) console.log(error);
                else {

                    chatIO.to(roomInUse).emit("vn", { body: result.url, user: { profileImageUrl: idUserProfileImage, _id: userID }, type: "vn" });
                    await Message.create({
                        user: userID,
                        room: roomInUse,
                        body: result.url,
                        format: "webm",
                        type: "vn"
                    });
                }
                const room = await Room.findOne({ roomID: roomInUse }).populate("participants.user").select("profileImageUrl username")
                const participants = room?.participants;
                const notUser = participants.filter(u => u.user._id != userID)[0];
                const payload = JSON.stringify({
                    title: `New voice message from ${socket?.currentUser?.username}`,
                    body: 'New voice message',
                    image: idUserProfileImage
                });
                if (!notUser) return;

                webPush.sendNotification(notUser?.user?.sub, payload)
                    .then(result => console.log(result))
                    .catch(e => console.log(e.stack))


                await createNotification(notUser?.user?._id, `New voice message from ${socket?.currentUser?.username}.`, userID
                );
            });
        });
        /// Listen for image 
        socket.on('image', async ({ b64, type, userID, room: roomInUse, caption }) => {
            console.log({ type, userID, room: roomInUse, caption })
            imagekit.upload({
                file: b64,
                fileName: `image_from_live_gists.${type}`,
            }, async function (error, result) {
                if (error) console.log(error);
                else {

                    chatIO.to(roomInUse).emit("image", { body: result.url, user: { _id: userID }, type: "image", caption, format: type });
                    await Message.create({
                        user: userID,
                        room: roomInUse,
                        body: result.url,
                        format: type,
                        type: "image",
                        caption
                    });
                    const room = await Room.findOne({ roomID: roomInUse }).populate("participants.user").select("profileImageUrl username")
                    const participants = room?.participants;
                    const notUser = participants.filter(u => u.user._id != userID)[0];
                    const payload = JSON.stringify({
                        title: `${socket?.currentUser?.username} sent you an image.`,
                        body: caption,
                        image: result.url
                    });
                    if (!notUser) return;

                    webPush.sendNotification(notUser?.user?.sub, payload)
                        .then(result => console.log(result))
                        .catch(e => console.log(e.stack))


                    await createNotification(notUser?.user?._id, `${socket?.currentUser?.username} sent you image.`, userID)

                }
            });

        });


        // Runs when client disconnects
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);

            if (user) {
                socket.to(user.room).emit('onlineUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                });
            }
        });

    });
    function userLeave(id) {
        const index = ONLINE_USERS.findIndex(user => user.socketID === id);

        if (index !== -1) {
            return ONLINE_USERS.splice(index, 1)[0];
        }
    }
    function userLeavePub(id) {
        const index = ONLINE_PUBLIC_CODE_USERS.findIndex(user => user.socketID === id);

        if (index !== -1) {
            return ONLINE_PUBLIC_CODE_USERS.splice(index, 1)[0];
        }
    }
    function userLeaveCollab(id) {
        const index = ONLINE_COLLAB_USERS.findIndex(user => user.socketID === id);

        if (index !== -1) {
            return ONLINE_COLLAB_USERS.splice(index, 1)[0];
        }
    }
    function formatMessage(username, text, id) {
        return {
            username,
            text,
            id,
            time: moment().format('LT'),
            timeISO: new Date().toISOString()
        };
    }

    function getCurrentUser(id) {
        return ONLINE_USERS.find(user => user.socketID === id);
    }
    function getRoomUsers(room) {
        return ONLINE_USERS.filter(user => user.room === room);
    }

    function userJoin(id, username, room, socketID) {

        const user = { id, username, room, socketID, time: new Date().toISOString() };
        ONLINE_USERS.push(user);
        return user;
    }
    function pubCoderJoin(id, username, room, socketID) {
        const user = { id, username, room, socketID };
        ONLINE_PUBLIC_CODE_USERS.push(user);
        return user;
    }
    function collabCoderJoin(id, username, room, socketID) {
        const user = { id, username, room, socketID };
        ONLINE_COLLAB_USERS.push(user);
        return user;
    }
    function genRoomID(name1, name2) {
        const newNameArr = [name1, name2];
        const sortedArr = newNameArr.sort();
        const roomID = sortedArr[0] + sortedArr[1] + process.env.CHAT_ROOM_SECRET
        return roomID;

    }



    /// Editor name space
    editorIO.on("connection", socket => {

        socket.on("join-editor", async ({ id, pubID, type }) => {
            switch (type) {
                case "normal":
                    const { code: normalCode, foundTheCode: foundTheNormalCode } = await findCode(id);
                    if (foundTheNormalCode) {
                        socket.join(normalCode.publicLink);
                        pubCoderJoin(normalCode.user._id, 'Admin', normalCode.publicLink, socket.id)
                        socket.join(normalCode?.collabLink);
                        collabCoderJoin(normalCode.user._id, "Admin", normalCode?.collabLink ?? '', socket.id)
                        socket.emit("load-code", { language: normalCode.language, username: normalCode.user.username, name: normalCode.name, data: normalCode.data } ?? '');
                    } else {
                        socket.to(socket.id).emit("code_does_not_exist");
                    }
                    socket.on("send-changes", ({ data, value, randID }) => {
                        socket.broadcast.to(normalCode.publicLink).to(normalCode.collabLink).emit("receive-changes", { data, value, sender_id: randID })
                    })
                    socket.on("save-code", async data => {
                        await updateDoc({ _id: id }, { data });
                    })
                    break;
                case "public":
                    const { code: publicCode, foundTheCode: foundThePublicCode } = await findCodeDoc(pubID);
                    if (foundThePublicCode) {
                        pubCoderJoin('notadmin', `user${Math.random().toString().split(".")[1]}`, publicCode.publicLink, socket.id)
                        socket.join(publicCode.publicLink);
                        socket.emit("load-code", { language: publicCode.language, username: publicCode.user.username, name: publicCode.name, data: publicCode.data } ?? '');
                    } else {
                        socket.to(socket.id).emit("code_does_not_exist");
                    }
                    break;
                case "collab":
                    const userColID = Math.random().toString().split(".")[1]
                    const { code: collabCode, foundTheCode: foundTheCollabCode } = await findCodeCollab(pubID);
                    if (foundTheCollabCode) {
                        pubCoderJoin('notadmin', `user${userColID}`, collabCode.publicLink, socket.id)
                        socket.join(collabCode.publicLink);
                        collabCoderJoin('notadmin', `user${userColID}`, collabCode.collabLink, socket.id)
                        socket.join(collabCode?.collabLink);
                        socket.emit("load-code", { language: collabCode.language, username: collabCode.user.username, name: collabCode.name, data: collabCode.data } ?? '');
                    } else {
                        socket.to(socket.id).emit("code_does_not_exist");
                    }
                    socket.on("send-changes", ({ data, value, randID }) => {
                        socket.broadcast.to(collabCode.publicLink).to(collabCode.collabLink).emit("receive-changes", { data, value, sender_id: randID })
                    });

                    break;
            }
        })
        socket.on('disconnect', () => {
            const user = userLeaveCollab(socket.id);
            const sameUser = userLeavePub(socket.id);

            if (user) {
                console.log(user.username, "collab  " + user.room);
                socket.to(user.room).emit('userLeft', user.username);
            }
            if (sameUser) {
                socket.to(sameUser.room).emit('userLeft', sameUser.username);
            }
        });
    });
    async function findCode(id) {
        const { found, doc } = await findDoc({ _id: id });
        if (found) return { code: doc, foundTheCode: true };
        return { code: "You cannot connect to anyone until you create an account", foundTheCode: false };
    }
    async function findCodeDoc(id) {
        const { found, doc } = await findDoc({ publicLink: id });
        if (found) return { code: doc, foundTheCode: true };
        return { code: "You cannot connect to anyone until you create an account", foundTheCode: false };
    }
    async function findCodeCollab(id) {
        const { found, doc } = await findDoc({ collabLink: id });
        if (found) return { code: doc, foundTheCode: true };
        return { code: "You cannot connect to anyone until you create an account", foundTheCode: false };
    }
}
module.exports = { server, app, doSockets, express };