// 1.连接数据库
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/recruit");
const connection = mongoose.connection;
connection.on("connected", () => {
  console.log("数据库连接成功!");
});

// 2.创建model对象
// 创建user的model对象
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  usertype: { type: String, required: true },
  avatar: { type: String },
  position: { type: String }, // 职位
  info: { type: String }, // 个人或职位简介
  company: { type: String },
  salary: { type: String },
});
const UserModel = mongoose.model("user", userSchema);

// 创建chat的model对象
const chatSchema = new mongoose.Schema({
  from: { type: String, required: true }, // 消息的发送方
  to: { type: String, required: true }, // 消息的接收方
  chatId: { type: String, required: true }, // from和to组成的字符串
  content: { type: String, required: true }, // 消息内容
  read: { type: Boolean, default: false }, // 消息是否已读
  createTime: { type: Number }, // 创建时间
});
const ChatModel = mongoose.model("chat", chatSchema);

// 3.暴露model对象
module.exports = {
  UserModel,
  ChatModel,
};
