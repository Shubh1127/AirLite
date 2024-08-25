const Listing =require("../models/listing")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async (req, res) => {
    // console.log(req.user)
    let allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
  }

  module.exports.renderNewForm=(req, res) => {
    res.render("./listings/new.ejs");
  }

  module.exports.showListing=async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");
    // console.log(listing.reviews);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!!");
      res.redirect("/listings");
    }
    let coordinates=listing.geometry.coordinates;
    // console.log(listing.owner.username)
    res.render("./listings/show.ejs", { listing ,coordinates,currUser: res.locals.currUser});
  }

  module.exports.createListing=async (req, res, next) => {
    let response =await geocodingClient.forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
      .send();

   let url= req.file.path;
   let filename=req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image={url,filename}
    newListing.geometry=response.body.features[0].geometry;

    console.log("Saving listing with geometry:", newListing.geometry);

    await newListing.save();
    // let coordinates=newListing.geometry.coordinates;
    // console.log("Saving listing with geometry:", newListing.geometry);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  }

  module.exports.renderEditForm=async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!!");
      res.redirect("/listings");
    }

    let originalImageUrl=listing.image.url;
    originalImageUrl= originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("./listings/edit.ejs", { listing ,originalImageUrl});
  }

  module.exports.updateListing=async (req, res) => {
    const { id } = req.params;
    const updatedData = { ...req.body.listing };

    // Ensure fields are handled as strings or other expected types
    for (let key in updatedData) {
      if (Array.isArray(updatedData[key])) {
        updatedData[key] = updatedData[key].join(", "); // Convert arrays to strings if needed
      }
    }

    try {
      // Update the listing
    let listing=   await Listing.findByIdAndUpdate(id, updatedData, { new: true }); // { new: true } returns the updated document
    if(typeof req.file !=="undefined"){
      let url=req.file.path;
      let filename=req.file.filename;
      listing.image={url,filename};
      await listing.save();
    }
      req.flash("success", "Listing Updated!");
      res.redirect(`/listings/${id}`);
    } catch (error) {
      console.error(error);
      res.status(400).send("Error updating listing");
    }
  }

  module.exports.destroyListing=async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndDelete(id);
    // console.log(listing)
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
  }