// src/app/registercharacter/page.tsx
"use client";
import Image from "next/image";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";

import styles from "./RegisterCharacter.module.css";

/** 파일 -> base64 변환 유틸 (모델이 base64를 지원하지 않는다면 public URL 필요) */
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

export default function RegisterCharacter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // 픽셀 아트 스타일 (예시)
  const FIXED_PIXEL_ART_STYLE =
    "26x36 pixel size, big-headed cute character style, crisp outlines, subtle shading for a lively chibi look, charming proportions, full-body figure, pure white background, facing left in a walking pose with a slightly dynamic posture";

  // 파일 선택 시
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFile(e.target.files[0]);
  };

  // "아바타 생성하기" 버튼 클릭 → 이미지 → Replicate → DALL·E (한 번에 처리)
  const handleGenerateAvatar = async () => {
    if (!selectedFile) {
      alert("파일을 먼저 선택해주세요!");
      return;
    }

    try {
      setIsLoading(true);
      setGeneratedImage("");

      // 1) 파일 -> base64 변환
      const dataUrl = await fileToDataUrl(selectedFile);

      // 2) Replicate img2prompt 호출 (이미지 → 텍스트)
      const replicateRes = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: dataUrl }),
      });
      const replicateData = await replicateRes.json();

      if (replicateData.error) {
        throw new Error(`Replicate error: ${replicateData.error}`);
      }

      let replicatePrompt = replicateData.result;
      // 모델 결과가 배열일 수도 있으므로 처리
      if (Array.isArray(replicatePrompt)) {
        replicatePrompt = replicatePrompt.join("\n");
      }

      // 3) DALL·E 이미지 생성 (프롬프트 = replicatePrompt)
      const dalleRes = await fetch("/api/generate-pixel-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixel_art_style: FIXED_PIXEL_ART_STYLE,
          person_description: replicatePrompt,
        }),
      });
      const dalleData = await dalleRes.json();

      if (!dalleData.success) {
        throw new Error(`DALL·E error: ${dalleData.error}`);
      }

      // 최종적으로 DALL·E 이미지 URL
      setGeneratedImage(dalleData.imageUrl);
    } catch (err) {
      // console.error("Error generating avatar:", err);
      alert("아바타 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ padding: "2rem" }}>
      <h1>아바타 생성 페이지</h1>

      {/* 파일 업로드 */}
      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* 아바타 생성 버튼 */}
      <Button
        onClick={handleGenerateAvatar}
        disabled={!selectedFile || isLoading}
      >
        아바타 생성하기
      </Button>

      {/* 로딩 스피너 (isLoading=true 인 동안 표시) */}
      {isLoading && (
        <div className={styles.spinnerOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {/* 최종 생성된 이미지 */}
      {generatedImage && (
        <div style={{ marginTop: "2rem" }}>
          <h2>생성된 아바타 이미지:</h2>
          {/* DALL·E가 반환한 URL을 그대로 <img>나 <Image>로 표시 */}
          <Image src={generatedImage} alt="avatar" width={512} height={512} />
        </div>
      )}
    </div>
  );
}
