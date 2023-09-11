const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false); //veritabanını daha güvenli ve daha tutarlı yapar şemalara uygun olmayan sorguları engeller (true hali)

    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`veritabanına bağlanıldı ${connect.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};
module.exports = connectDB;
