const Listing=require("./models/listing")

module.exports.isLoggedIn=((req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","you must be logged in to create listing!");
      return  res.redirect("/login")
    }
    next()
})

module.exports.saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner= async (req,res,next)=>{
    // Find the listing by ID
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Check if the current user is the owner of the listing
    if (!listing.owner.some(owner => owner.equals(res.locals.currUser._id))) {
        req.flash("error", "You don't have permission to make changes in this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
}