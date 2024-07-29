var express = require("express");
var router = express.Router();

const { UserModel, ChatModel } = require("../db/models");
const md5 = require("blueimp-md5");
// 过滤指定的属性,将它的值设为0
const filter = { password: 0, __v: 0 };

// 注册路由
router.post("/register", (req, res) => {
  // 1.获取请求参数
  const { username, password, usertype } = req.body;
  // 2.处理
  // 判断用户数据是否已经存在
  UserModel.findOne({ username }).then((user) => {
    if (user) {
      // 用户已存在,返回错误信息
      res.send({ code: 1, msg: "此用户已存在" });
    } else {
      UserModel.create({ username, password: md5(password), usertype }).then(
        (user) => {
          // 生成cookie(userid:user._id),交给浏览器保存
          res.cookie("userid", user._id, { maxAge: 1000 * 60 * 60 * 24 });
          // 响应数据不要携带密码,并且应该包含_id
          const data = { username, usertype, _id: user._id };
          res.send({ code: 0, data });
        }
      );
    }
  });
});

// 登录路由
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  // filter是自定义的过滤函数,表示查询结果过滤掉指定的属性
  UserModel.findOne({ username, password: md5(password) }, filter).then(
    (user) => {
      if (user) {
        // 生成cookie(userid:user._id),交给浏览器保存
        res.cookie("userid", user._id, { maxAge: 1000 * 60 * 60 * 24 });
        // 登录成功
        res.send({ code: 0, data: user });
      } else {
        // 登录失败
        res.send({ code: 1, msg: "用户名或密码不正确!" });
      }
    }
  );
});

// 更新用户信息的路由
router.post("/update", (req, res) => {
  // 从请求cookie中获取userid
  const userid = req.cookies.userid;
  // cookie不存在,说明未登录,不允许更新用户信息
  if (!userid) {
    return res.send({ code: 1, msg: "请先登录!" });
  }
  // 获取提交的用户数据
  const user = req.body;
  UserModel.findByIdAndUpdate(userid, user).then((oldUser) => {
    // 如果cookie被篡改,那么oldUser应该是没有值的
    if (!oldUser) {
      // 通知浏览器删除无效cookie
      res.clearCookie("userid");
      // 返回提示信息
      res.send({ code: 1, msg: "请先登录!" });
    } else {
      // 提交数据不包含id,用户名,用户类型
      const { _id, username, usertype } = oldUser;
      const data = Object.assign(user, { _id, username, usertype });
      res.send({ code: 0, data });
    }
  });
});

// 获取用户信息的路由(通过cookie的userid)
router.get("/user", (req, res) => {
  // 从请求cookie中获取userid
  const userid = req.cookies.userid;
  // cookie不存在,说明未登录,不允许更新用户信息
  if (!userid) {
    return res.send({ code: 1, msg: "请先登录!" });
  }
  // 根据userid查询对应的user
  UserModel.findOne({ _id: userid }, filter).then((user) => {
    res.send({ code: 0, data: user });
  });
});

// 获取用户列表的路由(根据用户类型)
router.get("/userlist", (req, res) => {
  const { usertype } = req.query;
  UserModel.find({ usertype }, filter).then((users) => {
    res.send({ code: 0, data: users });
  });
});

// 获取当前用户聊天列表的路由
router.get("/msglist", (req, res) => {
  const { userid } = req.cookies;
  // 查询所有的user
  UserModel.find().then((userDocs) => {
    // 用对象来存储所有的user,键是_id,值是包含用户名和头像的对象
    const users = {};
    userDocs.forEach((doc) => {
      users[doc._id] = { username: doc.username, avatar: doc.avatar };
    });

    // 获取与当前用户相关的聊天列表,即当前用户是消息的发送方或者接收方
    ChatModel.find({ $or: [{ from: userid }, { to: userid }] }, filter).then(
      (chatMsgs) => {
        // 响应对象的data包含users对象和chatMsgs数组
        res.send({ code: 0, data: { users, chatMsgs } });
      }
    );
  });
});

// 修改指定消息为已读的路由
router.post("/readmsg", (req, res) => {
  const from = req.body.from;
  // 修改别人发给自己的消息
  const to = req.cookies.userid;
  // 把消息设为已读
  ChatModel.updateMany({ from, to, read: false }, { read: true }).then(
    (doc) => {
      console.log("/readmsg", doc);
      res.send({ code: 0, data: doc.modifiedCount }); // modifiedCount是更新数量
    }
  );
});

module.exports = router;
