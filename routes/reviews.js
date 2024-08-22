const express=require("express")
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js")
const ExpressError=require("../utils/ExpressError.js")
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {reviewSchema}=require("../Schema.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");
const ReviewController = require("../controllers/reviews.js");

const validateReview=(req,res,next)=>{
    let{error}=reviewSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",")
        throw new ExpressError(400,errMsg)
    }
    else{
        next();
    }}





//post route
router.post("/", isLoggedIn,validateReview ,wrapAsync(ReviewController.createReview));

//delete review route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(ReviewController.destroyReview))



module.exports=router;