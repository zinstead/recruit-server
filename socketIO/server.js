const { ChatModel } = require("../db/models");

module.exports = function (server) {
  const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  const clients = {};
  // 监听客户端与服务器的连接
  io.on("connection", (socket) => {
    socket.on("user connected", (userid) => {
      clients[userid] = socket;
    });
    // 监听事件,接收客户端的消息
    socket.on("sendMsg", ({ recipient, message }) => {
      // 处理数据(保存消息)
      // 准备chatMsg对象相关的数据
      const { from, to, content } = message;
      const chatId = [from, to].sort().join("_");
      const createTime = Date.now();
      new ChatModel({ from, to, content, chatId, createTime })
        .save()
        .then((chatMsg) => {
          // 发送方和接收方都要发消息
          socket.emit("receiveMsg", chatMsg);
          if (clients[recipient]) {
            clients[recipient].emit("receiveMsg", chatMsg);
          }
        });
    });

    socket.on("disconnect", () => {
      Object.keys(clients).filter((userid) => clients[userid] !== socket);
    });
  });
};
