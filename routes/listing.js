const express=require("express")
const router=express.Router();
const Listing = require("../models/listing.js");
const wrapAsync=require("../utils/wrapAsync.js")
const {listingSchema}=require("../Schema.js")
// const Review = require('../models/review.js'); // Adjust the path as needed
const {isLoggedIn, isOwner}=require("../middleware.js")
const ExpressError=require("../utils/ExpressError.js")



const validateListing=(req,res,next)=>{
    let{error}=listingSchema.validate(req.body);
    if(error){
        console.log(error)
        throw new ExpressError(400,error)
    }
    else{
        next();
    }}

//show all listings
router.get("/",wrapAsync( async (req,res)=>{
    console.log(req.user)
    let allListings= await Listing.find({});
    res.render("./listings/index.ejs", { allListings })
})
);
//New Route
router.get("/new",isLoggedIn, (req,res)=>{
   
    res.render("./listings/new.ejs")
})

//show listing
router.get("/:id", wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id).populate("reviews").populate("owner")
    // console.log(listing.reviews);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!!")
        res.redirect("/listings")
    }
    console.log(listing.owner.username)
    res.render("./listings/show.ejs",{listing})
})
);

//create listing
router.post("/",validateListing,isLoggedIn, wrapAsync(async (req,res ,next)=>{

    const newListing=new Listing(req.body.listing);
        newListing.owner=req.user._id;
        await  newListing.save()
        req.flash("success","New Listing Created!")
        res.redirect("/listings");
    
})
)


//edit listing
router.get("/:id/edit", isLoggedIn,isOwner,wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!!")
        res.redirect("/listings")
    }
    res.render("./listings/edit.ejs",{listing})
})
)
// Update listing route
router.put("/:id", validateListing, isLoggedIn,isOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const updatedData = { ...req.body.listing };

    // Ensure fields are handled as strings or other expected types
    for (let key in updatedData) {
        if (Array.isArray(updatedData[key])) {
            updatedData[key] = updatedData[key].join(', '); // Convert arrays to strings if needed
        }
    }

    try {
        // Update the listing
        await Listing.findByIdAndUpdate(id, updatedData, { new: true }); // { new: true } returns the updated document
        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error(error);
        res.status(400).send("Error updating listing");
    }
}));



//delete listing

router.delete("/:id",isLoggedIn,isOwner, wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndDelete(id);
    console.log(listing)
    req.flash("success","Listing Deleted")
    res.redirect("/listings");
}));

module.exports=router;