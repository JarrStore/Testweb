const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const settings = require("./settings");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/api/register", async (req, res) => {
    const { nama, email, nomor, password } = req.body;

    if (!nama || !email || !nomor || !password) {
        return res.json({ status: false, message: "Data tidak lengkap" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    // ================= JSON =================
    if (settings.storage === "json") {
        const file = "./database/users.json";
        const users = fs.existsSync(file)
            ? JSON.parse(fs.readFileSync(file))
            : [];

        if (users.find(u => u.email === email)) {
            return res.json({ status: false, message: "Email sudah terdaftar" });
        }

        users.push({
            nama,
            email,
            nomor,
            password: hashed,
            created_at: Date.now()
        });

        fs.writeFileSync(file, JSON.stringify(users, null, 2));
    }

    // ================= MYSQL =================
    if (settings.storage === "mysql") {
        const db = await mysql.createConnection(settings.mysql);

        const [cek] = await db.execute(
            "SELECT id FROM users WHERE email=?",
            [email]
        );

        if (cek.length) {
            return res.json({ status: false, message: "Email sudah terdaftar" });
        }

        await db.execute(
            "INSERT INTO users (nama, email, nomor, password) VALUES (?, ?, ?, ?)",
            [nama, email, nomor, hashed]
        );
    }

    // ================= MONGODB =================
    if (settings.storage === "mongodb") {
        await mongoose.connect(settings.mongodb.uri);

        const User = mongoose.model("User", new mongoose.Schema({
            nama: String,
            email: String,
            nomor: String,
            password: String,
            created_at: Number
        }));

        const cek = await User.findOne({ email });
        if (cek) {
            return res.json({ status: false, message: "Email sudah terdaftar" });
        }

        await User.create({
            nama,
            email,
            nomor,
            password: hashed,
            created_at: Date.now()
        });
    }

    res.json({ status: true });
});
