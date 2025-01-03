"use strict";
import express from "express";
import tokenMiddleware from "../middleware/tokenMiddleware";
const imagesRouter = express.Router();
import path from "path";
import fs from "fs";

imagesRouter.post("/delete-images", tokenMiddleware.verifyToken, (req, res) => {
  const imageUrls = req.body.urls;
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const deletePromises = imageUrls.map((url) => {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const folderName = pathParts[1];
    const imageName = pathParts.pop();
    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      folderName,
      imageName
    );
    return new Promise((resolve, reject) => {
      fs.stat(imagePath, (err) => {
        if (err) {
          return reject({ imageName, message: "Image not found" });
        }

        fs.unlink(imagePath, (err) => {
          if (err) {
            return reject({ imageName, message: "Could not delete image" });
          }
          resolve({ imageName, message: "Image deleted successfully" });
        });
      });
    });
  });

  Promise.allSettled(deletePromises)
    .then((results) => {
      const response = results.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return result.reason;
        }
      });
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({ message: "An error occurred", error: err });
    });
});

export default imagesRouter;
