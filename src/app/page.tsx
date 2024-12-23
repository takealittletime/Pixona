// src/app/page.tsx
"use client";
import Image from "next/image";
import { useState } from "react";

// 간단한 유틸: File -> Base64 변환
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) resolve(reader.result.toString());
      else reject("Could not convert file to base64.");
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  // 파일 업로드 관련 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Replicate에서 받은 텍스트(프롬프트)
  const [replicatePrompt, setReplicatePrompt] = useState("");

  // 최종적으로 DALL·E가 생성한 이미지 URL
  const [generatedImage, setGeneratedImage] = useState("");

  // 로딩 상태
  const [isConverting, setIsConverting] = useState(false); // img2txt
  const [isGenerating, setIsGenerating] = useState(false); // DALL·E

  // 픽셀 아트 스타일: 고정 문자열
  const FIXED_PIXEL_ART_STYLE =
    "26x36 pixel size, big-headed cute character style, crisp outlines, subtle shading for a lively chibi look, charming proportions, full-body figure, pure white background, facing left in a walking pose with a slightly dynamic posture";

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFile(e.target.files[0]);
  };

  // 1) 이미지를 Replicate(img2prompt)로 전달하여 텍스트 추출
  const handleConvertImageToPrompt = async () => {
    if (!selectedFile) return;

    try {
      setIsConverting(true);
      setReplicatePrompt("");

      // 1-1) 파일을 base64 Data URL로 변환
      const dataUrl = await fileToDataUrl(selectedFile);

      // 1-2) /api/replicate에 POST
      const res = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: dataUrl }),
      });

      const { result, error } = await res.json();
      if (error) {
        // console.error("Replicate error:", error);
        return;
      }

      // result가 배열일 수도 있고, 문자열일 수도 있으니 확인
      if (Array.isArray(result)) {
        // 여러 줄일 경우 join
        setReplicatePrompt(result.join("\n"));
      } else {
        // 단일 문자열일 가능성
        setReplicatePrompt(result);
      }
    } catch (err) {
      // console.error("Failed to convert image:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // 2) 받은 텍스트를 이용해 DALL·E 이미지 생성
  const handleGenerateDalleImage = async () => {
    if (!replicatePrompt) {
      alert("먼저 이미지를 변환하여 Prompt를 받아오세요!");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImage("");

      // /api/generate-pixel-art로 POST
      const res = await fetch("/api/generate-pixel-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixel_art_style: FIXED_PIXEL_ART_STYLE, // 고정 스타일
          person_description: replicatePrompt, // img2prompt로 받은 텍스트
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedImage(data.imageUrl);
      } else {
        // console.error("Failed to generate image:", data.error);
      }
    } catch (err) {
      // console.error("Failed to call DALL·E API:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Image Upload → img2txt → DALL·E Example</h1>

      {/* 1) 이미지 업로드 */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Select Image:
          <input type="file" accept="image/*" onChange={handleFileSelect} />
        </label>
      </div>

      {/* 2) Replicate(img2txt) 호출 */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleConvertImageToPrompt}
          disabled={!selectedFile || isConverting}
        >
          {isConverting ? "Processing Image..." : "Convert to Prompt (img2txt)"}
        </button>
      </div>

      {/* 3) Replicate 결과(프롬프트) 표시 */}
      {replicatePrompt && (
        <div style={{ marginBottom: "1rem" }}>
          <h2>Replicate Prompt Result:</h2>
          <pre>{replicatePrompt}</pre>
        </div>
      )}

      {/* 4) DALL·E 이미지 생성 */}
      <div>
        <button
          onClick={handleGenerateDalleImage}
          disabled={!replicatePrompt || isGenerating}
        >
          {isGenerating
            ? "Generating DALL·E Image..."
            : "Generate DALL·E Image"}
        </button>
      </div>

      {/* 5) 최종 생성된 DALL·E 이미지 표시 */}
      {generatedImage && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Generated Image by DALL·E:</h2>
          <Image
            src={generatedImage}
            alt="pixel art"
            width={1024}
            height={1024}
            unoptimized={true}
          />
        </div>
      )}
    </div>
  );
}
