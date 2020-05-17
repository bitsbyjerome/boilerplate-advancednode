"use strict";

require('dotenv').config();
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;
const localStrategy = require('passport-local');


const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(
    {
        secret:process.env.SESSION_SECRET,
        resave:true,
        saveUninitialized:true,
    }

));

app.use(passport.initialize());
app.use(passport.session());



mongo.connect(process.env.DATABASE, {useUnifiedTopology:true}, (err, dbClient)=>{
    if(err){
        console.log('Database error: '+ err);
    }else{
        console.log('Database connection successful');
        let db = dbClient.db('test');
        passport.use(new localStrategy(
            (username, password, done)=>{
                db.collection('users').findOne({username:username}, (dbErr, user)=>{
                    console.log('User '+ username + 'attempted to login');
                    if(dbErr){return done(dbErr)}
                    if(!user){return done(null, false)}
                    if(password!== user.password){return done(null, false)}
                    return done(null, user)
                })
            }
        ));
        passport.serializeUser((user, done) => {
            done(null, user._id);
        });

        passport.deserializeUser((id, done) => {
            db.collection('users').findOne(
                {_id: new ObjectID(id)},
                (err, doc) => {
                    done(null, doc);
                }
            );
        });

        app.route("/profile")
            .get(ensureAuthenticated, (req, res)=>{

                res.render('pug/profile', {
                    username: req.user.username
                })
            });

        app.post('/login', passport.authenticate(
            'local',
            {successRedirect:'/profile', failureRedirect:'/'}), function(req, res){

        });

        app.listen(process.env.PORT || 3000, () => {
            console.log("Listening on port " + 3000);
        });

    }

});



app.set('view engine', 'pug');


function ensureAuthenticated(req, res, next){

    if(req.isAuthenticated()){
        return next();
    }
    return res.redirect("/")

}

app.route("/").get((req, res) => {
    //Change the response to render the Pug template
    res.render("pug/index", {title:'Home Page ',
        message:'Please login',
        showLogin:true,

    });
});
