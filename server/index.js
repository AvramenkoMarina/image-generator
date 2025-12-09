import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const createRes = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: { prompt } }),
      }
    );

    let result = await createRes.json();

    // Безпечний polling
    while (result.status !== "succeeded" && result.status !== "failed") {
      if (!result.urls || !result.urls.get) {
        console.error("No polling URL returned from Replicate API:", result);
        return res.status(500).json({ error: "No polling URL from API" });
      }
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(result.urls.get, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      result = await pollRes.json();
    }

    if (result.status === "failed") {
      console.error("Generation failed:", result);
      return res.status(500).json({ error: "Generation failed" });
    }

    if (!result.output || !result.output[0]) {
      console.error("No output returned from API:", result);
      return res.status(500).json({ error: "No output from generation" });
    }

    res.json({ url: result.output[0] });
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, "../client/dist");

console.log("Serving React build from:", clientBuildPath);

app.use(express.static(clientBuildPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
    if (err) {
      console.error("Error sending index.html:", err);
      res.status(500).send(err);
    }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
