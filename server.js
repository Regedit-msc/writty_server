const mongoose = require("mongoose")
const cors = require("cors");
require("dotenv").config();
const { server, app, doSockets, express } = require("./utils/doSockets");
const baseRouter = require("./routes/index");
require('./utils/cache');
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(baseRouter.path, baseRouter.router);
const PORT = process.env.PORT || 3001;
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
  doSockets();
  server.listen(PORT, () => {
    console.log("Server has started on " + PORT)
  })
})()