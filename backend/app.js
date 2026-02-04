if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: __dirname + "/.env" });
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Debug: Log if SECRET is loaded
console.log("SECRET loaded:", !!process.env.SECRET);

const listingRoutes = require("./routes/listing.route");
const reviewRoutes = require("./routes/reviews.route");
const userRoutes = require("./routes/user.route");
const paymentRoutes = require("./routes/payment.route");
const wishlistRoutes = require("./routes/wishlist.route");

const ExpressError = require("./utils/ExpressError.util");

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   DATABASE CONNECTION
========================= */
const dbURL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Airbnb";

mongoose
  .connect(dbURL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://air-lite.vercel.app"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES
========================= */
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/listings/:id/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({ message: "AirLite API running 🚀" });
});

/* =========================
   404 HANDLER
========================= */
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Route not found"));
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  res.status(statusCode).json({ error: message });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
