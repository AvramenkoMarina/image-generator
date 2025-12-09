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
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          prompt,
          output_format: "png",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    const data = await response.json();

    const base64 = data.image;
    const url = `data:image/png;base64,${base64}`;

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
