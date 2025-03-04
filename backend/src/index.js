import express from "express";
import { ApifyClient } from "apify-client";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({});
const app = express();
const port = process.env.PORT;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create the API endpoint
app.get("/api/reviews", async (req, res) => {
  try {
    const { url, reviewsStartDate } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    const client = new ApifyClient({
      token:process.env.APIFY_TOKEN,
    });

    const input = {
      startUrls: [
        {
          url: url || process.env.URL,
          method: "GET",
        },
      ],
      reviewsStartDate: reviewsStartDate || '2025-01-05',
      language: "en",
      personalData: true,
      reviewsSort: "newest",
    };

    // Run the actor
    const run = await client
      .actor("compass/google-maps-reviews-scraper")
      .call(input);

    // Get the data
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Process data for frontend
    const simplifiedReviews = items.map((item) => {
      // For place data
      if (item) {
        return {
          type: "placeInfo",
          name: item.name,
          title: item.title,
          totalScore: item.totalScore,
          reviewsCount: item.reviewsCount,
          address: item.address,
          author: item.author,
          stars: item.stars,
          text: item.text,
          publishedAtDate: item.publishedAtDate,
          publishAt: item.publishAt,
        };
      }

      return item;
    });

    res.json(simplifiedReviews);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
