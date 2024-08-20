const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new Scehma({
    email:{
        type:String,
        required:true
    }
})

User.pulgin(passportLocalMongoose)

module.exports=mongoose.model('User', userSchema)