"use strict";

require('dotenv').config();
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;




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

mongo.connect(process.env.DATABASE, {useUnifiedTopology:true}, (err, db)=>{
    if(err){
        console.log('Database error: '+ err);
    }else{
        console.log('Database connection successful')
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
        app.listen(process.env.PORT || 3000, () => {
            console.log("Listening on port " + 3000);
        });
    }

});



// passport.deserializeUser(
//     (id, done)=>{
//         done(null, null)
//     }
// );

app.set('view engine', 'pug');

app.route("/").get((req, res) => {
  //Change the response to render the Pug template
    res.render("pug/index", {title:'Hello', message:'Please login'});
});
