const express=require("express")
const router=express.Router()
const User=require("../models/user.js")
const wrapAsync = require("../utils/wrapAsync")
const passport = require("passport")
const { saveRedirectUrl } = require("../middleware.js")
const UserController = require("../controllers/users");

router
    .route("/signup")
    .get(UserController.renderSignupForm)
    .post( wrapAsync (UserController.signup));
router
    .route("/login")
    .get(UserController.renderLoginForm)
    .post(saveRedirectUrl,passport.authenticate("local",{failureRedirect: '/login',failureFlash:true}),UserController.login)


router.get("/logout",UserController.logout)

module.exports=router