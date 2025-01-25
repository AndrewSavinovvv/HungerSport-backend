import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { registerValidation } from "./validations/auth.js";
import {validationResult} from "express-validator";
import connectDB from './db.js';
import UserModel from "./models/user.js";
import chechAuth from "./ulits/chechAuth.js";

mongoose
    .connect('mongodb+srv://admin:UJe69LIIe1sDBkh4@cluster0.5o0me.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log("DB "))
    .catch((err) => console.log("DB err", err));

const app = express();
connectDB();
app.use(express.json());

app.post("/auth/login",  async (req, res) => {
    try {
        const user = await UserModel.findOne({email: req.body.email });

        if(!user) {
            return res.status(404).json({
                message:"Пользователь не неайден"
            })
        }

       const  isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if(!isValidPass) {
            return res.status(400).json({
                message:"Неверный логин или пароль"
            })
        }


        const token = jwt.sign({
            _id: user._id,
        }, "secret123", {
            expiresIn: "30d",
        });

        const {passwordHash, ...userData} = user._doc

        res.json({
            ...userData,
            token
        })

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: `Не удалось авторизоваться`,
        })
    }
})

app.post('/auth/register', registerValidation, async (req, res) => {
   try {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
           return res.status(400).json(errors.array());
       }

       const password = req.body.password;
       const salt = await bcrypt.genSalt(10);
       const hash = await bcrypt.hash(password, salt);


       const doc = new UserModel({
           email: req.body.email,
           fullName: req.body.fullName,
           avatarUrl: req.body.avatarUrl,
           passwordHash: hash,


       });

       const user = await doc.save();




       const {passwordHash, ...userData} = user._doc

       res.json({
           ...userData,

       })
   } catch (err) {
       console.log(err);
       res.status(500).json({
           message: `Не удалось зарегестрироватья`,
       })

   }
})

app.get('/auth/me',chechAuth, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);

        if(!user) {
            return res.status(404).json({
                message: "user not found"
            })
        }


        const {passwordHash, ...userData} = user._doc

        res.json({
            ...userData,

        })
    } catch (err) {}
})

app.listen(4444, () => {
    console.log("Server running on port: 4444");
});