const bcrypt = require("bcryptjs");
const express = require("express");
const {UserModel, TodoModel} = require("./db");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); 
const {z} = require("zod");

mongoose.connect("mongodb+srv://faizan123:faizan123@cluster0.h0m9jr8.mongodb.net/todo-app-database");
const JWT_SECRET = "ilovekiara"
const app = express();

app.use(express.json());

app.post("/signup", async function(req,res){
    const requiredBody = z.object({
        email: z.string().min(3).max(100).email(),
        name: z.string().min(3).max(100),
        password: z.string().min(3).max(30)
    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    
    if(!parsedDataWithSuccess.success){
        res.json({
            message: "Incorrect format",
            error: parsedDataWithSuccess.error
        })
        return
    }
       
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    try {
        const hashedPassword = await bcrypt.hash(password,5);
        console.log(hashedPassword);

        await UserModel.create({
            email: email,
            password: hashedPassword,
            name: name
    });
    res.json({
        message: "You are logged in"
    })
    } catch (e) {
        if (e.code === 11000) { // Duplicate key error
            res.status(400).json({
                message: "Email already exists"
            });
        } else {
            console.error(e);
            res.status(500).json({
                message: "Something went wrong"
            });
        }
    }
});

app.post("/signin", async function(req,res){
    const email = req.body.email;
    const password = req.body.password;

    const response = await UserModel.findOne({
        email: email,
    });

    if(!response){
        res.status(403).json({
            message: "User does not exist in our db "
        })
        return
    }

    const passwordMatch = await bcrypt.compare(password,response.password);


    if(passwordMatch){
        const token = jwt.sign({
            id: response._id.toString()
        }, JWT_SECRET)
        res.json({
            token: token
        })
    }else{
        res.status(403).json({
            message: "Invalid credientials"
        })
    }
 
});

app.post("/todo",auth,function(req,res){
    const userId = req.userId;
    const title = req.body.title;
    TodoModel.create({
        title,
        userId
    })

    res.json({
        userId: userId
    })

});

app.get("/todo",auth, function(req,res){
    const userId = req.userId;

    res.json({
        userId: userId
    })
});

function auth(req,res,next){
    const token = req.headers.token;

    const decodedData = jwt.verify(token, JWT_SECRET);

    if(decodedData){
        req.userId = decodedData.id;
        next();
    }else{
        res.status(403).json({
            message: "Incorrect credientials"
        })
    }
}

app.listen(3000);