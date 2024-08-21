const mongoose = require("mongoose")
const initData=require("./data.js")
const Listing=require("../models/listing.js")

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

const initDB=async ()=>{
    await Listing.deleteMany({})
    initData.data=initData.data.map((obj)=>({...obj,owner:"66c4dba4ba8a1a5b81f5324c"}))
    await Listing.insertMany(initData.data);
    console.log("data was initialized")
};
initDB();