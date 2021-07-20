const mongoose = require("mongoose")
const express = require('express');
const http = require("http");
const app = express();
const webPush = require("web-push");
const _ = require("lodash");
const server = http.createServer(app);
const cors = require("cors");
const User = require("./User");
const moment = require('moment');
const ErrorHandling = require("./utils/errors/index");
const { createUser, findUser, updateUser } = require("./utils/user_utils/index");
require("dotenv").config();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
const { signJWT, extractJWT } = require("./utils/jwt/index");
const { getAllDocsByUsers, createDoc, findDoc, updateDoc, deleteDoc } = require("./utils/doc_utils");
const { paginatedDocs } = require("./utils/paginateDocs");
var ImageKit = require("imagekit");
const { createNotification } = require("./utils/notification_utils");
const { getUserIDFromToken } = require("./utils/token_utils");
const { findMessages } = require("./utils/message_utils");
const Message = require("./Message");
const Room = require("./Room");
var imagekit = new ImageKit({
  publicKey: `${process.env.PUBLIC_KEY}`,
  privateKey: `${process.env.PRIVATE_KEY}`,
  urlEndpoint: `${process.env.PUBLIC_URL}`
});

webPush.setVapidDetails("mailto:efusanyaae@gmail.com", process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY)
const ONLINE_USERS = [];
const ONLINE_PUBLIC_CODE_USERS = [];
const ONLINE_COLLAB_USERS = []
const PORT = process.env.PORT || 3001;
let noofm = 0;
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FE_ORIGIN,
    methods: ["GET", "POST"],
  },
})
const editorIO = io.of("/editor1")
const chatIO = io.of("/chat");
const publicIO = io.of("/public")
let runs = 0;
(async () => {
  runs += 1;
  console.log(`The server code ran ${runs} time.`)
  mongoose.connect(process.env.NODE_ENV === "development" ? process.env.MONGO_URI_DEV : process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  }).then(() => {
    console.log("Connected to db");
  }).catch((e) => console.log(e.message));






  publicIO.on("connection", socket => {
    console.log("public con")
    socket.on("join-editor", () => {
      socket.join("public-room");
      socket.on("send-changes", ({ data, value, randID }) => {
        socket.broadcast.to("public-room").emit("receive-changes", { data, value, sender_id: randID })
      })
    })
  })


  chatIO.adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
  });

  chatIO.adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
  });
  chatIO.on('connect_error', error => {
    // send error
    console.log(error)
  })

  chatIO.on("connection", socket => {
    console.log("connected")
    socket.on("join-chat", async ({ name }) => {
      if (socket.handshake.auth.token) {
        getUserIDFromToken(socket.handshake.auth.token, async ({ found, user_id }) => {
          if (found) {
            const { found, user: idUser } = await findUser({ _id: user_id });
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
      chatIO.to(user?.room).emit('onlineUsers',
        'onlineUsers', {
        room: roomID,
        users: getRoomUsers(roomID)
      });
    });
    // Listen for chatMessage
    socket.on('message', async ({ msg }) => {
      noofm += 1;
      console.log(noofm);

      const user = getCurrentUser(socket.id);
      chatIO.to(user?.room).emit('message', formatMessage(user && user.username, msg, user.id));

      if (user) {
        await Message.create({
          room: user.room,
          body: msg,
          user: user.id,
          type: "message"
        });
        const room = await Room.findOne({ roomID: user?.room });
        const participants = room?.participants;
        const notUser = participants.filter(u => u.user !== user.id);
        const payload = JSON.stringify({
          title: `New message from ${user.username}`,
          body: msg,
          image: socket.currentUser.profileImageUrl
        });
        if (!notUser?.sub) return;
        webPush.sendNotification(notUser.sub, payload)
          .then(result => console.log(result))
          .catch(e => console.log(e.stack))

      }


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
      time: moment().format('dddd').substring(0, 3) + " " + moment().format('h:mm a')
    };
  }

  function getCurrentUser(id) {
    return ONLINE_USERS.find(user => user.socketID === id);
  }
  function getRoomUsers(room) {
    return ONLINE_USERS.filter(user => user.room === room);
  }

  // function getPublicCodeUsers(room) {
  //   return ONLINE_PUBLIC_CODE_USERS.filter(user => user.room === room);
  // }

  // function getCollabCodeUsers(room) {
  //   return ONLINE_COLLAB_USERS.filter(user => user.room === room);
  // }


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


  app.post("/login", async (req, res, next) => {
    const { username, password } = req.body
    try {
      const user = await User.login(username, password);
      if (user) {
        signJWT(user._id, null, (err, token) => {
          if (err) return res.status(200).json({ message: 'Could not sign token ', success: false });
          res.status(200).json({ message: token, success: true })
        })
      }

    } catch (error) {
      const newError = ErrorHandling.handleErrors(error);
      res.status(200).json({ message: newError?.message, success: false })
    }

  })



  app.post("/register", async (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(200).json({ message: "Fill out all the required fields", success: false });
    try {
      const something = await User.register(email, username);
      if (something) return res.status(200).json({ message: "Email or username already exists.", success: false });

      const { saved } = await createUser(username, email, password);

      if (saved) return res.status(200).json({ message: 'Created new account', success: true });

    } catch (error) {
      const newError = ErrorHandling.handleErrors(error);
      res.status(200).json({ message: newError.message, success: false })
    }




  })

  app.post("/like", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { publicLink } = req.body;
    const { user } = await findUser({ _id: username })
    const { doc } = await findDoc({ publicLink });
    const alreadyLiked = doc?.likes.findIndex((e) => e.user == username);
    function doCheck(id) {
      if (doc.user._id == id) return true;
      return false;
    }

    if (alreadyLiked === -1) {
      const { updated } = await updateDoc({ _id: doc._id }, { likes: [...doc.likes, { user: username }] });
      const payload = JSON.stringify({
        title: 'Like',
        body: `${doCheck(username) ? "You" : user.username} reacted to your gist.`,
        image: user.profileImageUrl,
      })
      webPush.sendNotification(doc.user.sub, payload)
        .then(result => console.log(result))
        .catch(e => console.log("Push failed"))

      await createNotification(doc.user._id, `${doCheck(username) ? "You" : user.username} reacted to your gist.`, username);
      if (updated) return res.status(200).json({ message: "Liked code.", success: true });

    } else {

      const { updated } = await updateDoc({ _id: doc._id }, { likes: [...doc.likes.filter(e => e.user != username)] })
      if (updated) return res.status(200).json({ message: "Unliked code.", success: true })
    }

  })

  // app.post("/comment", extractJWT, async (req, res, next) => {
  //   const { username } = req.locals;
  //   const { docID, commentBody } = req.body;
  //   const { user } = await findUser({ _id: username });
  //   const { doc } = await findDoc({ _id: docID });
  //   const { updated } = await updateDoc({ _id: docID }, { comments: [...doc.comments, { user: user._id, body: commentBody }] });
  //   if (updated) return res.status(200).json({ message: "Commented on code.", success: true })
  // })


  app.post('/notifications/subscribe', extractJWT, async (req, res) => {
    const { username } = req.locals;
    const subscription = req.body
    await updateUser({ _id: username }, { sub: subscription });
    res.status(200).json({ message: "Subscripton added", success: true })
  });

  app.get("/details", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
      const { foundDocs, docs } = await getAllDocsByUsers({ user: username });

      if (foundDocs) return res.status(200).json({ message: docs, username: user.username, success: true, image: user.profileImageUrl, uid: user._id });
    }
    res.status(200).json({ message: "No details found", success: false });

  })

  app.post("/create/doc", extractJWT, async (req, res, next) => {
    const { name, _id, language, private, publicLink } = req.body;
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
      const { saved } = await createDoc(name, _id, user._id, language.trim(), private, publicLink);

      if (saved) return res.status(200).json({ message: "New document created", success: true })
    }
  });
  app.get("/search/docs", async (req, res, next) => {
    const { wol } = req.query;
    const { foundDocs, docs } = await getAllDocsByUsers({ name: { $regex: (new RegExp(wol.replace(/^"(.*)"$/, '$1'))), $options: "i" }, private: false })
    if (foundDocs) {
      res.status(200).json({ message: docs, success: true })
    }


  });


  app.post("/delete/doc", extractJWT, async (req, res, next) => {
    const { docID } = req.body;
    const { username } = req.locals;
    const { deleted } = await deleteDoc({ _id: docID, user: username });
    if (deleted) {

      return res.status(200).json({ message: "Deleted doc ", success: true })
    }
    res.status(200).json({ message: "Failed to delete doc ", success: false })
  });

  app.get("/public/docs", async (req, res, next) => {
    const { foundDocs, docs } = await getAllDocsByUsers({ private: false });
    res.status(200).json({
      message: _.map(docs, object => {
        return _.omit(object, ['_id'])
      }), success: foundDocs
    })
  });
  app.get("/user/name", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { user } = await findUser({ _id: username });
    res.status(200).json({ message: _.omit(user, ["password", "email"]), success: true })
  })
  app.get("/public/docs/paginated", paginatedDocs({ private: false }), async (req, res, next) => {
    res.status(200).json({ message: res.paginatedResults, success: true })
  });
  app.get('/details/public', async (req, res, next) => {
    const { name } = req.query;
    const { found, user } = await findUser({ username: name });
    if (!found) return res.status(200).json({ message: "User not found", success: false });
    const { docs } = await getAllDocsByUsers({ user: user._id, private: false });
    res.status(200).json({
      message: {
        image: user?.profileImageUrl,
        code: docs,
        name: user.name,
        email: user.email,
        userID: user._id
      }, success: true
    })

  })
  app.post("/update/visibility/doc", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { docID } = req.body;
    const { doc } = await findDoc({ _id: docID, user: username });
    const { updated } = await updateDoc({ _id: docID }, { private: !(doc.private) })
    res.status(200).json({ message: "Updated doc visibility.", success: updated })
  });

  app.post("/create/collab", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { docID, collabLink } = req.body;
    const { doc } = await findDoc({ _id: docID, user: username });
    const { updated } = await updateDoc({ _id: docID }, { collabLink })
    res.status(200).json({ message: "Created collab link.", success: updated })
  })

  app.post("/delete/collab", extractJWT, async (req, res, next) => {
    const { docID } = req.body;
    const { updated } = await updateDoc({ _id: docID }, { collabLink: null })
    res.status(200).json({ message: "Deleted collab link.", success: updated })
  });

  app.get("/get/comments", async (req, res, next) => {
    const { id } = req.query;
    const { doc } = await findDoc({ publicLink: id });
    res.status(200).json({ message: doc?.comments, success: true })
  })
  app.get("/get/code", async (req, res, next) => {
    const { id } = req.query;
    const { found, doc } = await findDoc({ publicLink: id });
    if (!found) return res.status(200).json({ message: "No code found", success: false })
    res.status(200).json({ message: doc, success: true })
  })
  app.post("/create/comment", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { publicLink, body } = req.body;
    const { doc } = await findDoc({ publicLink });
    function doCheck(id) {
      if (doc.user._id == id) return true;
      return false;
    }
    const { user } = await findUser({ _id: username });
    const payload = JSON.stringify({
      title: 'Comment',
      body: `${doCheck(username) ? "You" : user.username} commented on your gist.`,
    })
    webPush.sendNotification(doc.user.sub, payload)
      .then(result => console.log(result))
    await createNotification(doc.user._id, `${doCheck(username) ? "You" : user.username} commented on your gist.`, username);
    const { updated } = await updateDoc({ _id: doc._id }, { comments: [...doc.comments, { user: username, body }] });
    res.status(200).json({ message: "Commented on some code.", success: updated })

  })
  app.post('/profile/image', extractJWT, async (req, res, next) => {
    const { username } = req.locals
    const { b64, type } = req.body;
    imagekit.upload({
      file: b64,
      fileName: `profile_image_from_live_gists.${type}`,
    }, async function (error, result) {
      if (error) return console.log(error);
      await updateUser({ _id: username }, { profileImageUrl: result.url })
      res.status(200).json({ message: result?.url ?? '', success: true })
    });
  })

  server.listen(PORT, () => {
    console.log("Server has started on " + PORT)
  })
})()