require("dotenv").config()
const express = require("express");
const cors = require("cors");
const mysql = require('mysql')
const bcrypt = require("bcrypt")
const generateAccessToken = require("./generateAccessToken")
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "6%9f5!N8fcjd",
    database: "userlist",
    port: "3306"

});

con.connect(function (err) {
    if (err) {
        console.log(err);
    } else
        console.log("Connected");
});

const req = express.request;
const res = express.response;
const app = express();

app.use(cors());
app.use(express.json());


//Register Backend
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const email = req.body.email;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const sqlSearch = "SELECT * FROM userdb WHERE user = ?"
    const search_query = mysql.format(sqlSearch, [user])
    const sqlInsert = "INSERT INTO userdb VALUES (0,?,?,?)"
    const insert_query = mysql.format(sqlInsert, [user, email, hashedPassword])
    con.query(search_query, async (err, result) => {
        if (err) throw (err)
        console.log("Search Results...")
        console.log(result.length)
        if (result.length != 0) {
            console.log("User already exists!")
            res.sendStatus(409)
        } else {
            con.query(insert_query, (err, result) => {
                if (err) throw (err)
                console.log("Created new User")
                console.log(result.insertId)
                res.sendStatus(201)
            })
        }
    })

});

//Login Backend
app.post('/login', (req, res) => {
    const user = req.body.user;
    const password = req.body.password;
    const sqlSearch = "Select * from userdb where user = ?";
    const search_query = mysql.format(sqlSearch, [user]);
    con.query(search_query, async (err, result) => {

        if (err) throw err;
        if (result.length == 0) {
            console.log("--------> User does not exist")
            res.sendStatus(404)
        } else {
            const hashedPassword = result[0].password;
            if (await bcrypt.compare(password, hashedPassword)) {
                console.log("---------> Login Successful")
                console.log("---------> Generating accessToken")
                const token = generateAccessToken({ user: user })
                console.log(token)
                res.json({ accessToken: token })
            } else {
                console.log("---------> Password Incorrect")
                res.send("Password incorrect!")
            }
        }
    })
})

app.get('/get', (req, res) => {
    con.query('SELECT * FROM userdb', (err, result) => {
        if (err) throw err;
        res.json(result);
    })
});

const port = process.env.TOKEN_SERVER_PORT
//get the port number from .env file
app.listen(port, () => {
    console.log(`Authorization Server running on ${port}...`)
})