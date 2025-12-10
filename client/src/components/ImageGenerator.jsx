import { useState } from "react";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt) return;
    setLoading(true);
    setImageUrl("");

    try {
      const res = await fetch(
        "https://image-generator-a5jb.onrender.com/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!res.ok) throw new Error("Failed to generate image");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      alert("Error generating image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-generator">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />
      <button onClick={generateImage} disabled={!prompt || loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
      {imageUrl && <img src={imageUrl} alt="Generated" />}
    </div>
  );
}
