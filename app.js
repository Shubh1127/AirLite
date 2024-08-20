const express=require("express")
const mongoose=require("mongoose");
const session=require("express-session")
const path=require("path")
const method=require("method-override");
const ejsMate=require("ejs-mate")

const ExpressError=require("./utils/ExpressError.js")



const listings=require("./routes/listing.js")
const reviews=require("./routes/reviews.js")

const sessionOptions={
    secret: "musupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
    }
}


let app=express();
let port=8080;
app.use(method("_method"));
app.use(session(sessionOptions))

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


//listings & reviews
app.use("/listings",listings)
app.use("/listings/:id/reviews",reviews)


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});


app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message)
})