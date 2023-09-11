const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const { dirname, extname } = require("path");
const { uuid } = require("uuidv4");

const Post = require("../models/post");
const User = require("../models/user");
const Log = require("../models/log");
const log = require("../models/log");

const adminLayout = "../views/layouts/admin";

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "yetkisiz giriş" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "yetkisiz giriş" });
  }
};

router.get("/admin", (req, res) => {
  const token = req.cookies.token;
  const message = null;

  if (!token) {
    res.render("admin/index", { message });
  } else {
    res.redirect("/dashboard");
  }
});

router.post("/admin", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  let message = null;

  if (!user) {
    // return res;
    // .status(401)
    // .json({ message: "geçersiz giriş bilgileri- kullanıcı bulunamadı" });

    message = "geçersiz giriş bilgileri- kullanıcı bulunamadı";
    return res.render("admin/index", { message });
  }

  const parolaKontrol = await bcrypt.compare(password, user.password);

  if (!parolaKontrol) {
    // return res
    //   .status(401)
    //   .json({ message: "geçersiz giriş bilgileri-parola yanlış" });

    message = "geçersiz giriş bilgileri- parola yanlış";
    return res.render("admin/index", { message });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token, { httpOnly: true });

  res.redirect("/dashboard");
});

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let message = null;

    try {
      const user = await User.create({ username, password: hashedPassword });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

      res.cookie("token", token, { httpOnly: true });

      res.redirect("/dashboard");
    } catch (error) {
      if ((error.code = 11000)) {
        // res.status(409).json({ message: "Böyle bir kullanıcı var" });

        message = "Böyle bir kullanıcı var";
        return res.render("admin/register", { message });
      }
      // res.status(500).json({ message: "server hatası" });

      message = "Server hatası";
      return res.render("admin/register", { message });
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const data = await Post.find().sort({ createdAt: -1 });

    const userId = req.userId;
    const user = await User.findOne({ _id: userId });

    res.render("admin/dashboard", {
      data,
      layout: adminLayout,
      user: user.username,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const message = null;

    res.render("admin/add-post", { message, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    const { postImage } = req.files;

    if (
      postImage.mimetype === "image/jpeg" ||
      postImage.mimetype === "image/png"
    ) {
      const appDir = dirname(require.main.filename);

      const benzersiIsim = uuid() + extname(postImage.name);

      const postImageUrl = appDir + "/public/img/" + benzersiIsim;

      await postImage.mv(postImageUrl);

      const yeniPost = new Post({
        title: req.body.title,
        body: req.body.body,
        imageUrl: "/img/" + benzersiIsim,
      });

      await Post.create(yeniPost);

      const user = await User.findById(req.userId);
      const yeniLog = new Log({
        method: "POST",
        id: yeniPost._id,
        username: user.username,
        oldValue: null,
      });
      await Log.create(yeniLog);

      res.redirect("dashboard");
    } else {
      message = "jpeg veya png uzantılı dosya seçiniz";
      return res.render("admin/add-post", { message });
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const data = await Post.findOne({ _id: req.params.id });
    res.render("admin/edit-post", { data, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const eskiPost = await Post.findById(req.params.id);

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
    });

    const user = await User.findById(req.userId);

    const yeniLog = new Log({
      method: "PUT",
      id: req.params.id,
      username: user.username,
      oldValue: eskiPost,
    });
    await Log.create(yeniLog);

    res.redirect(`../post/${req.params.id}`);
  } catch (error) {
    console.log(error);
  }
});

router.get("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    const eskiPost = await Post.findById(req.params.id);

    await Post.deleteOne({ _id: req.params.id });

    const user = await User.findById(req.userId);

    const yeniLog = new Log({
      method: "DELETE",
      id: req.params.id,
      username: user.username,
      oldValue: eskiPost,
    });
    await Log.create(yeniLog);

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.get("/register", (req, res) => {
  const message = null;
  res.render("admin/register", { message });
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const loglar = await Log.find({ username: user.username })
      .sort({
        createdAt: -1,
      })
      .limit(5);

    res.render("admin/profile", { user, layout: adminLayout, loglar });
  } catch (error) {
    console.log(error);
  }
});

router.post("/profile", authMiddleware, async (req, res) => {
  try {
    await User.findById(req.userId, {
      phone: req.body.phone,
      email: req.body.email,
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

router.get("/others", authMiddleware, async (req, res) => {
  try {
    const data = await User.find();

    res.render("admin/others", { data, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.get("/log/:id", authMiddleware, async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    res.render("admin/log", { log, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.get("/other-logs/:username", authMiddleware, async (req, res) => {
  try {
    const username = req.params.username;
    const loglar = await Log.find({ username })
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("admin/other-logs", { loglar, username, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post("/other-logs", authMiddleware, async (req, res) => {
  try {
    const { method, username } = req.body;

    const loglar = await Log.find({ $and: [{ method }, { username }] })
      .sort({
        createdAt: -1,
      })
      .limit(5);

    res.render("admin/other-logs", { loglar, username, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
