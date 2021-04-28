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
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })




  const io = require("socket.io")(server, {
    cors: {
      origin: process.env.FE_ORIGIN,
      methods: ["GET", "POST"],
    },
  })

  io.of("/doc").on("connection", socket => {
    console.log("connected to client");
    socket.on("get-document", async documentId => {

      console.log(documentId);
      const { doc, foundTheDoc } = await findDocument(documentId);
      if (foundTheDoc) {
        socket.join(documentId);
        socket.emit("load-document", doc.data ?? '');


      } else {

      }
     
      socket.on("send-changes", delta => {
        socket.broadcast.to(documentId).emit("receive-changes", delta)
      })

      socket.on("save-document", async data => {
        await updateDoc({ _id: documentId }, { data });
      })
    })
  })

  async function findDocument(id) {
    const { found, doc } = await findDoc({ _id: id });
    if (found) return { doc, foundTheDoc: true };
    return { doc: "You cannot connect to anyone until you create an account", foundTheDoc: false };
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
      res.status(200).json({ message: newError.message, success: false })
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
      console.log(docs);
      if (foundDocs) return res.status(200).json({ message: docs, username: user.username, success: true });
    }
    res.status(200).json({ message: "No details found", success: false });

  })

  app.post("/create/doc", extractJWT, async (req, res, next) => {
    const { name, _id } = req.body;
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
      const { saved } = await createDoc(name, _id, user._id);
      if (saved) return res.status(200).json({ message: "New socument created", success: true })
    }
  });

  app.post("/delete/doc", async (req, res, next) => {
    const { docID } = req.body;
    const { deleted } = await deleteDoc({ _id: docID });
    if (deleted) {
      
      return res.status(200).json({ message: "Deleted doc ", success: true })
    }
    res.status(200).json({ message: "Failed to delete doc ", success: false })
  });
  server.listen(PORT, () => {
    console.log("Server has started on " + PORT)
  })
})()