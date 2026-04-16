const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");
const { isLoggedIn } = require("../middlewares/auth.middlware");

router.get("/conversations", isLoggedIn, chatController.getConversations);
router.get("/listings/:listingId", isLoggedIn, chatController.getChatByListing);
router.get("/conversations/:reservationId/messages", isLoggedIn, chatController.getMessages);
router.post("/conversations/:reservationId/messages", isLoggedIn, chatController.sendMessage);

module.exports = router;
