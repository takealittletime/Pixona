// src/app/page.tsx
"use client";
import { useState } from "react";

export default function Home() {
  // PixelArtStyle을 고정 상수로 선언
  const FIXED_PIXEL_ART_STYLE =
    "26x36 pixel size, big-headed cute character style, crisp outlines, subtle shading for a lively chibi look, charming proportions, full-body figure, pure white background, facing left in a walking pose with a slightly dynamic posture";

  const [personDescription, setPersonDescription] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateImage = async () => {
    try {
      setIsLoading(true);
      setResultImage("");

      const res = await fetch("/api/generate-pixel-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixel_art_style: FIXED_PIXEL_ART_STYLE, // 고정된 스타일
          person_description: personDescription, // 사용자 입력
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultImage(data.imageUrl);
      } else {
        console.error("Failed to generate image:", data.error);
      }
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Generate Pixel Art Character</h1>

      <div style={{ marginTop: "1rem" }}>
        <label>
          Character Description:
          <input
            type="text"
            value={personDescription}
            onChange={(e) => setPersonDescription(e.target.value)}
            placeholder="예) anime character with a tie and glasses..."
            style={{ width: "300px", marginLeft: "1rem" }}
          />
        </label>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleGenerateImage} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Image"}
        </button>
      </div>

      {resultImage && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Generated Image:</h2>
          <img src={resultImage} alt="pixel art result" />
        </div>
      )}
    </div>
  );
}
