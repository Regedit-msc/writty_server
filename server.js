const mongoose = require("mongoose")
const express = require('express');
const http = require("http");
const app = express();
const webPush = require("web-push");
const _ = require("lodash");
const server = http.createServer(app);
const cors = require("cors");
const User = require("./User");
const crypto = require('crypto');
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
const bcrypt = require("bcrypt");
const { createNotification } = require("./utils/notification_utils");
const { getUserIDFromToken } = require("./utils/token_utils");
const { findMessages } = require("./utils/message_utils");
const Message = require("./Message");
var imagekit = new ImageKit({
  publicKey: `${process.env.PUBLIC_KEY}`,
  privateKey: `${process.env.PRIVATE_KEY}`,
  urlEndpoint: `${process.env.PUBLIC_URL}`
});
webPush.setVapidDetails("mailto:efusanyaae@gmail.com", process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY)
const ONLINE_USERS = [];
const PORT = process.env.PORT || 3001;
(async () => {
  mongoose.connect(process.env.NODE_ENV === "development" ? process.env.MONGO_URI_DEV : process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  }).then(() => {
    console.log("Connected to db");
  }).catch((e) => console.log(e.message));



  const io = require("socket.io")(server, {
    cors: {
      origin: process.env.FE_ORIGIN,
      methods: ["GET", "POST"],
    },
  })




  io.of("/public").on("connection", socket => {
    socket.on("join-editor", () => {
      socket.join("public-room");
      socket.on("send-changes", ({ data, value, randID }) => {
        socket.broadcast.to("public-room").emit("receive-changes", { data, value, sender_id: randID })
      })
    })
  })

  io.of('/chat').use(async (socket, next) => {
    if (socket.handshake.auth.token) {
      const { found, user_id } = getUserIDFromToken(socket.handshake.auth.token);

      if (found) {
        const { user: idUser } = await findUser({ _id: user_id });
        socket.userID = user_id;
        socket.currentUser = idUser
        next()
      } else {
        next(new Error("Your session has timed out."))
      }
      next();
    } else {
      next(new Error("You are not authenticated."))
    }
  })
  io.of('/chat').on('connect_error', error => {
    // send error
  })

  io.of("/chat").on("connection", socket => {

    socket.on("join-chat", async ({ name }) => {
      const { found: foundNameUser, user: nameUser } = await findUser({ username: name });
      if (foundNameUser) {
        const { found, user: idUser } = await findUser({ _id: socket.userID });
        if (found) {
          const roomID = genRoomID(nameUser.username, idUser.username);
          const { found: foundMessages, messages } = await findMessages({ room: roomID });
          if (roomID) {
            userJoin(socket.userID, idUser.name, roomID, socket.id);
            socket.join(roomID);
            socket.broadcast
              .to(roomID)
              .emit(
                'onlineUsers', {
                room: roomID,
                users: getRoomUsers(roomID)
              }
              );
            if (foundMessages) {
              socket.emit("load-messages", { messages, success: true, roomID });
            } else {
              socket.emit("load-messages", { success: false });
            }
          }
        } else {
          /// ID user not found 
        }
      } else {
        /// Name user not found
      }
    });
    /// Typing event 
    socket.on("typing", ({ roomID, username }) => {
      socket.broadcast.to(roomID).emit('typing', `${username} is typing.`);
    });
    // Listen for chatMessage
    socket.on('message', async ({ msg }) => {
      const user = getCurrentUser(socket.id);
      const roomUsers = getRoomUsers(user.room);
      const notCurrentUser = roomUsers.filter(u => u.socketID !== socket.id);
      io.to(user && user.room).emit('message', formatMessage(user && user.username, msg));
      const { user: notUser } = await findUser({ _id: notCurrentUser.id })

      if (user) {
        await Message.create({
          room: user.room,
          body: msg,
          user: user.id,
          type: "message"
        });

        const payload = JSON.stringify({
          title: `New message from ${user.username}`,
          body: msg,
          image: socket.currentUser.profileImageUrl
        })

        if (!notUser.sub) return;

        webPush.sendNotification(notUser.sub, payload)
          .then(result => console.log(result))
          .catch(e => console.log(e.stack))

      }


    });
    /// Listen for image 
    socket.on('image', async (image) => {
      const user = getCurrentUser(socket.id);
      const roomUsers = getRoomUsers(user.room);
      const notCurrentUser = roomUsers.filter(u => u.socketID !== socket.id);
      const { user: notUser } = await findUser({ _id: notCurrentUser.id })
      io.to(image.room).emit("image", image);
      imagekit.upload({
        file: image.b64,
        fileName: `livegists.${image.type}`,
      }, async function (error, result) {
        if (error) console.log(error);
        else {
          await Message.create({
            room: image.room,
            user: image.user,
            body: result.url,
            type: "image",
            format: image.type
          });
          const payload = JSON.stringify({
            title: `${user.username} sent you an image.`,
            body: `${user.username} sent you an image.`,
            image: result.url
          })

          if (!notUser.sub) return;

          webPush.sendNotification(notUser.sub, payload)
            .then(result => console.log(result))
            .catch(e => console.log(e.stack))
        }
      });

    });
    /// Voice note
    /// When an audio file is received 
    socket.on('audio', async (audio) => {
      const user = getCurrentUser(socket.id);
      const roomUsers = getRoomUsers(user.room);
      const notCurrentUser = roomUsers.filter(u => u.socketID !== socket.id);
      const { user: notUser } = await findUser({ _id: notCurrentUser.id })
      io.to(audio.room).emit("audio", audio);
      imagekit.upload({
        file: audio.b64,
        fileName: "audio_from_livegists.webm",
      }, async function (error, result) {

        if (error) console.log(error);
        else {
          await Message.create({
            room: audio.room,
            type: "vn",
            user: audio.user,
            body: result.url,
          });
          const payload = JSON.stringify({
            title: `${user.username} sent you a voice note.`,
            body: `${user.username} sent you a voice note.`,
            image: socket.currentUser.profileImageUrl
          })

          if (!notUser.sub) return;

          webPush.sendNotification(notUser.sub, payload)
            .then(result => console.log(result))
            .catch(e => console.log(e.stack))
        }
      });
    })



    socket.on('isRecording', user => {
      /// Send audio to everyone including sender
      socket.broadcast.to(user.room).emit("isRecording", user);
    })

    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
        io.to(user.room).emit('onlineUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });

  });
  function userLeave(id) {
    const index = ONLINE_USERS.findIndex(user => user.id === id);

    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
  }
  function formatMessage(username, text) {
    return {
      username,
      text,
      time: moment().format('dddd').substring(0, 3) + " " + moment().format('h:mm a')
    };
  }

  function getCurrentUser(id) {
    return ONLINE_USERS.find(user => user.socketID === id);
  }
  function getRoomUsers(room) {
    return ONLINE_USERS.filter(user => user.room === room);
  }

  function hashPwd(password, salt) {
    var hashPwd = crypto.createHash('sha256').update(salt + password);
    for (var x = 0; x < 199; x++) {
      hashPwd = crypto.createHash('sha256').update(salt + hashPwd);
    }
    return hashPwd.digest('hex');
  }
  function userJoin(id, username, room, socketID) {
    const user = { id, username, room, socketID };
    ONLINE_USERS.push(user);
    return user;
  }
  function genRoomID(name1, name2) {
    const newNameArr = [name1, name2];
    const sortedArr = newNameArr.sort();
    const passwordHash = hashPwd(sortedArr[0] + sortedArr[1], process.env.CHAT_ROOM_SECRET);
    return passwordHash;

  }

  io.of("/editor1").on("connection", socket => {

    socket.on("join-editor", async ({ id, pubID, type }) => {
      switch (type) {
        case "normal":
          const { code: normalCode, foundTheCode: foundTheNormalCode } = await findCode(id);
          if (foundTheNormalCode) {
            socket.join(normalCode.publicLink);
            socket.join(normalCode?.collabLink);
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
            socket.join(publicCode.publicLink);
            socket.emit("load-code", { language: publicCode.language, username: publicCode.user.username, name: publicCode.name, data: publicCode.data } ?? '');
          } else {
            socket.to(socket.id).emit("code_does_not_exist");
          }
          break;
        case "collab":
          const { code: collabCode, foundTheCode: foundTheCollabCode } = await findCodeCollab(pubID);
          if (foundTheCollabCode) {
            socket.join(collabCode.publicLink);
            socket.join(collabCode?.collabLink);
            socket.emit("load-code", { language: collabCode.language, username: collabCode.user.username, name: collabCode.name, data: collabCode.data } ?? '');
          } else {
            socket.to(socket.id).emit("code_does_not_exist");
          }
          socket.on("send-changes", ({ data, value, randID }) => {
            socket.broadcast.to(collabCode.publicLink).to(collabCode.collabLink).emit("receive-changes", { data, value, sender_id: randID })
          })
          socket.on("save-code", async data => {
            await updateDoc({ _id: id }, { data });
          })
          break;
      }
    })
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
        .catch(e => console.log(e.stack))

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

      if (foundDocs) return res.status(200).json({ message: docs, username: user.username, success: true, image: user.profileImageUrl });
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