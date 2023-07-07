require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const methodOverride = require('method-override');

app = express();
const saltRounds = 10;
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname +"/public"));
app.use(methodOverride('_method'));

const url = process.env.MONGO_URI;
mongoose.connect(url);
const AdminSchema = new mongoose.Schema({
    userID:{
        type:String,
        required:true
    },
    passKey:{
        type:String,
        required:true
    }
});
const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    gender:String,
    status:String,
    updatedBy: AdminSchema
})
const Admin = new mongoose.model("Admin",AdminSchema);
const User = new mongoose.model("User",UserSchema);


app.route("/")
.get((req,res)=>{
    res.render("login");

})
.post((req,res)=>{
    Admin.findOne({userID: req.body.userID}).then((foundAdmin)=>{
        if(foundAdmin && (req.body.passKey ==  foundAdmin.passKey)){
            res.redirect("/dashboard/"+foundAdmin.userID);
        }
        else{
            res.send("Wrong userID or passKey");
        }
    })
});

app.route("/dashboard/:accessAdmin")
.get((req,res)=>{

    Admin.findOne({userID:req.params.accessAdmin}).then((foundAdmin)=>{
        if(foundAdmin){
            User.find({}).then((foundUsers)=>{
                res.render("home",{
                        admin:req.params.accessAdmin,
                        users:foundUsers
                }); 
            });
        }
        else{
            res.send("Not Authorized");
        }
    });

    
});


app.route("/dashboard/:accessAdmin/newUser")
.get((req,res)=>{
    Admin.findOne({userID:req.params.accessAdmin}).then((foundAdmin)=>{
        if(foundAdmin){
            res.render("add-user",{admin:foundAdmin.userID});
        }
       else{
        res.send("Not Authorized");
       }
    });
    
})
.post((req,res)=>{
    Admin.findOne({userID:req.params.accessAdmin}).then((foundAdmin)=>{
        if(foundAdmin){
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                gender:req.body.gender,
                status:req.body.status,
                updatedBy:foundAdmin
            });
            newUser.save().then(()=>{
                console.log(" user saved");
                res.redirect("/dashboard/"+foundAdmin.userID);
            });
        }
    })
    
});
app.route("/dashboard/:admin/:userID")
.get((req,res)=>{
    Admin.findOne({userID:req.params.admin}).then((foundAdmin)=>{
        User.findOne({_id:req.params.userID}).then((foundUser)=>{
            res.render("update-user",{admin:foundAdmin,user:foundUser});
        })
    }).catch((err)=>{
        console.log(err);
    })
})
.put((req,res)=>{
    Admin.findOne({userID:req.params.admin}).then((foundAdmin)=>{
        User.replaceOne(
            {_id:req.params.userID},
            {
                name:req.body.name,
                email:req.body.email,
                gender:req.body.gender,
                status:req.body.status,
                updatedBy:foundAdmin
            }
            ).then((updatedUser)=>{
                console.log(updatedUser);
                res.redirect("/dashboard/"+req.params.admin);
            })
    })
    
})
.delete((req,res)=>{
    Admin.findOne({userID:req.params.admin}).then((foundAdmin)=>{
        User.findByIdAndDelete({_id:req.params.userID}).then(()=>{
            console.log("deleted");
            res.redirect("/dashboard/"+req.params.admin);
        })
    })
})

app.route("/register")
.get((req,res)=>{
    res.render("register");
})
.post((req,res)=>{

        const newAdmin = new Admin({
            userID:req.body.userID,
            passKey:req.body.passKey
        });
        newAdmin.save().then(()=>{
            console.log("Added");
            res.redirect("/");
        })
    
    
    
})

app.listen(process.env.PORT || 3000,()=>{
    console.log("Running");
});