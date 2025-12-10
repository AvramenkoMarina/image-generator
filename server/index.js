import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const createTask = async () => {
      return await axios.post(
        "https://stablehorde.net/api/v2/generate/async",
        {
          prompt,
          params: {
            width: 512,
            height: 512,
            steps: 15,
            cfg_scale: 7,
            sampler_name: "k_lms",
            n_samples: 1,
          },
        },
        {
          headers: {
            apikey: process.env.STABLE_HORDE_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
    };

    const response = await createTask();
    const taskId = response.data.id;
    console.log("Task created:", taskId);

    let result = null;
    let retries = 0;

    while (!result) {
      await new Promise((r) => setTimeout(r, 5000));

      try {
        const status = await axios.get(
          `https://stablehorde.net/api/v2/generate/status/${taskId}`,
          { headers: { apikey: process.env.STABLE_HORDE_API_KEY } }
        );

        if (status.data.finished) {
          result = status.data.generations[0].img;
        }
      } catch (err) {
        if (err.response?.status === 429) {
          console.log("Rate limit hit, waiting 10 seconds...");
          await new Promise((r) => setTimeout(r, 10000));
        } else {
          throw err;
        }
      }

      retries++;
      if (retries > 20) break;
    }

    if (!result)
      return res.status(429).json({ error: "Rate limit exceeded or timeout" });

    if (!result || typeof result !== "string") {
      return res.status(500).json({
        error: "Invalid image data",
        detail: result,
      });
    }

    const imageBuffer = Buffer.from(result, "base64");
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (err) {
    console.error("Error generating image:", err.response?.data || err);
    res.status(500).json({
      error: "Failed to generate image",
      detail: err.response?.data || err.message,
    });
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
