import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    // 1. Створюємо предикцію
    const createRes = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { prompt },
        }),
      }
    );

    const prediction = await createRes.json();
    console.log("Prediction started:", prediction);

    // 2. Опитування (polling) кожні 2 секунди
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollRes = await fetch(result.urls.get, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      result = await pollRes.json();
      console.log("Polling status:", result.status);
    }

    if (result.status === "failed") {
      return res.status(500).json({ error: "Generation failed" });
    }

    // 🔥 Вивід у консоль для перевірки
    console.log("FULL RESULT:", result);
    console.log("FULL OUTPUT:", result.output);

    // 3. Витягаємо картинку (у flux-1.1-pro це просто рядок)
    const imageUrl = result.output;

    if (!imageUrl) {
      return res.status(500).json({
        error: "No image returned from Replicate",
        output: result.output,
      });
    }

    // 4. Відправляємо URL на клієнт
    res.json({ url: imageUrl });
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
