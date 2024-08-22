const Listing =require("../models/listing")
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
    // console.log(listing.owner.username)
    res.render("./listings/show.ejs", { listing ,currUser: res.locals.currUser});
  }

  module.exports.createListing=async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
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
    res.render("./listings/edit.ejs", { listing });
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
      await Listing.findByIdAndUpdate(id, updatedData, { new: true }); // { new: true } returns the updated document
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