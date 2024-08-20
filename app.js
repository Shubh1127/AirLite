const express=require("express")
const mongoose=require("mongoose");
const session=require("express-session")
const path=require("path")
const method=require("method-override");
const ejsMate=require("ejs-mate")
const flash=require("connect-flash")
const ExpressError=require("./utils/ExpressError.js")
const passport=require("passport");
const LocalStrategy=require("passport-local")
const User=require("./models/user.js");


const listingRouter=require("./routes/listing.js")
const reviewRouter=require("./routes/reviews.js")
const userRouter=require("./routes/user.js")

const sessionOptions={
    secret: "musupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        htttpOnly:true,
    }
}


let app=express();
let port=8080;
app.use(method("_method"));

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))
app.use(express.urlencoded({extended:true}))
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"public")))

const url="mongodb://127.0.0.1:27017/Airbnb";
async function main() {
    await mongoose.connect(url)
}
main().then(()=>{
    console.log("connected to db")
}) 
.catch((err)=>{
    console.log(err)
})


app.listen(port,(req,res)=>{
    console.log("app is listening to port ",port);
})



//root path
app.get("/",(req,res)=>{
    res.send("hello i am root")
})

app.use(session(sessionOptions))
app.use(flash());

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    // console.log(res.locals.success)
    next();
})

// app.get("/demouser", async (req,res)=>{
//     let fakeUser=new User({
//         email:"Shubamsinghmor2312@gmail.com",
//         username:"Shubh1127"
//     })
//    let registereduser= await User.register(fakeUser,"helloworld")
//    res.send(registereduser)
// })

//listings & reviews
app.use("/listings",listingRouter)
app.use("/listings/:id/reviews",reviewRouter)
app.use("/", userRouter)

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});


app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message)
})