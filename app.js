const express=require("express")
const mongoose=require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const path=require("path")
const method=require("method-override");
const ejsMate=require("ejs-mate")
const wrapAsync=require("./utils/wrapAsync.js")
const ExpressError=require("./utils/ExpressError.js")
const listingSchema=require("./Schema.js")
const reviewSchema=require("./Schema.js");
const review = require("./models/review.js");
const listings=require("./routes/listing.js")

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

const validateReview=(req,res,next)=>{
let{error}=reviewSchema.validate(req.body);
if(error){
    let errMsg=error.details.map((el)=>el.message).join(",")
    throw new ExpressError(400,errMsg)
}
else{
    next();
}

}
//root path
app.get("/",(req,res)=>{
    res.send("hello i am root")
})
app.use("/listings",listings)

//REVIEWS
//post route
app.post("/listings/:id/reviews", validateReview ,wrapAsync(async (req,res)=>{
    let listing= await Listing.findById(req.params.id);
    
    let newReview =new Review(req.body.review)
   

    listing.reviews.push(newReview)


    await newReview.save()
   await  listing.save()

   console.log("review was saved")
   res.redirect(`/listings/${listing._id}`)
}));

//delete review route
app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async (req,res)=>{
    let {id,reviewId}=req.params;

    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`)
}))

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message)
})

