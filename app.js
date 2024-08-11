const express=require("express")
const mongoose=require("mongoose");
const Listing = require("./models/listing.js");
const path=require("path")

let app=express();
let port=8080;

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))
app.use(express.urlencoded({extended:true}))

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

//show listing
app.get("/listings/:id", async (req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id);
    res.render("./listings/show.ejs",{listing})
})

//create listing
app.post("/listings",async (req,res)=>{
    let listing=req.body.listing;
    console.log(listing);
})

