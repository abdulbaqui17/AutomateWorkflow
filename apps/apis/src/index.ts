import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import express from "express";
import userRouter from "./router/user.js";
import zapRouter from "./router/zap.js";
import catalogRouter from "./router/catalog.js";
import cors from "cors"
import formRouter from "./router/form.js";
import telegramRouter from "./router/telegram.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse HTML form data
app.use(cors())

app.use("/api/v1/users",userRouter)
app.use("/api/v1/zap",zapRouter)
app.use("/api/v1", catalogRouter)
app.use("/api/v1", formRouter)
app.use("/api/v1", telegramRouter)

app.get("/test", (req, res) => {
  res.json({ 
    message: "✅ HOT RELOAD IS WORKING PERFECTLY!",
    timestamp: new Date().toISOString(),
    containerized: true
  });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});