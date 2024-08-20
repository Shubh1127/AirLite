const express=require("express")
const router=express.Router();
const Listing = require("../models/listing.js");
const wrapAsync=require("../utils/wrapAsync.js")
const {listingSchema}=require("../Schema.js")
// const Review = require('../models/review.js'); // Adjust the path as needed

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
    let allListings= await Listing.find({});
    res.render("./listings/index.ejs", { allListings })
})
);
//New Route
router.get("/new", (req,res)=>{
    res.render("./listings/new.ejs")
})

//show listing
router.get("/:id", wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id).populate("reviews")
    // console.log(listing.reviews);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!!")
        res.redirect("/listings")
    }
    res.render("./listings/show.ejs",{listing})
})
);

//create listing
router.post("/",validateListing, wrapAsync(async (req,res ,next)=>{

    const newListing=new Listing(req.body.listing);
        await  newListing.save()
        req.flash("success","New Listing Created!")
        res.redirect("/listings");
    
})
)


//edit listing
router.get("/:id/edit", wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!!")
        res.redirect("/listings")
    }
    res.render("./listings/edit.ejs",{listing})
})
)
//update listing
router.put("/:id",validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let updatedData = { ...req.body.listing };
   

    // Ensure fields are handled as strings or other expected types
    for (let key in updatedData) {
        // If you have fields that are expected to be arrays, handle them differently.
        // Here, we are treating fields as strings or other types.
        if (Array.isArray(updatedData[key])) {
            updatedData[key] = updatedData[key].join(', '); // Convert arrays to strings if needed
        }
    }

    try {
        await Listing.findByIdAndUpdate(id, updatedData, { new: true }); // { new: true } returns the updated document
        req.flash("success","Listing Updated!")
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error(error);
        res.status(400).send("Error updating listing");
    }
})
);


//delete listing

router.delete("/:id", wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndDelete(id);
    console.log(listing)
    req.flash("success","Listing Deleted")
    res.redirect("/listings");
}));

module.exports=router;