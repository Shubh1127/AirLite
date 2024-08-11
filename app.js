const express=require("express")
const mongoose=require("mongoose");
const Listing = require("./models/listing.js");
const path=require("path")
const method=require("method-override");
const ejsMate=require("ejs-mate")

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
app.get("/AirBnb",(req,res)=>{
    res.send("success")
})

app.get("/",(req,res)=>{
    res.redirect("/listings")
})
//show all listings
app.get("/listings", async (req,res)=>{
    let allListings= await Listing.find({});
    // let title= await Listing.findOne({title:"Cozy Beachfront Cottage"});
    // let title = await Listing.findOne({ title: { $regex: new RegExp("Cozy Beachfront Cottage", "i") } });

    // console.log(title)
    // console.log(allListings)
    res.render("./listings/index.ejs", { allListings })
})

//add new listing
app.get("/listings/new", (req,res)=>{
    res.render("./listings/new.ejs")
})


//create listing
app.post("/listings",async (req,res)=>{
    const newListing=new Listing(req.body.listing);
   await  newListing.save()
    res.redirect("/listings");
})


//show listing
app.get("/listings/:id", async (req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id);
    res.render("./listings/show.ejs",{listing})
})

app.get("/listings/:id/edit", async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("./listings/edit.ejs",{listing})
})

//edit listing
app.put("/listings/:id",async (req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`)
})
//delete listing

app.delete("/listings/:id", async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
})