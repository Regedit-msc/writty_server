const mongoose = require("mongoose")
const Doc = require("./Document")
const express = require('express');
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const User = require("./User");
const ErrorHandling = require("./utils/errors/index");
const { createUser, findUser } = require("./utils/user_utils/index");
require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { signJWT, extractJWT } = require("./utils/jwt/index");
const { getAllDocsByUser, createDoc, findDoc, updateDoc, deleteDoc } = require("./utils/doc_utils");

const PORT = process.env.PORT || 3001;


(async () => {
  mongoose.connect(process.env.MONGO_URI, {
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

  io.of("/editor1").on("connection", socket => {
    console.log("connected to client");
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
    console.log(id);
    const { found, doc } = await findDoc({ _id: id });
    console.log(doc.data, "doc data");
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
      console.log(saved);
      if (saved) return res.status(200).json({ message: 'Created new account', success: true });

    } catch (error) {
      const newError = ErrorHandling.handleErrors(error);
      res.status(200).json({ message: newError.message, success: false })
    }




  })



  app.get("/details", extractJWT, async (req, res, next) => {
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
      const { foundDocs, docs } = await getAllDocsByUser({ user: username });
      console.log(docs)
      if (foundDocs) return res.status(200).json({ message: docs, username: user.username, success: true });
    }
    res.status(200).json({ message: "No details found", success: false });

  })

  app.post("/create/doc", extractJWT, async (req, res, next) => {
    const { name, _id, language, private, publicLink } = req.body;
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
      const { saved } = await createDoc(name, _id, user._id, language.trim(), private, publicLink);
      console.log(saved);
      if (saved) return res.status(200).json({ message: "New document created", success: true })
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
    const { foundDocs, docs } = await getAllDocsByUser({ private: false });
    res.status(200).json({ message: docs, success: foundDocs })
  });

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
    const { username } = req.locals;
    const { docID } = req.body;
    const { doc } = await findDoc({ _id: docID, user: username });
    const { updated } = await updateDoc({ _id: docID }, { collabLink: null })
    res.status(200).json({ message: "Deleted collab link.", success: updated })
  })

  server.listen(PORT, () => {
    console.log("Server has started on " + PORT)
  })
})()