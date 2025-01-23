// src/app/registercharacter/page.tsx
"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

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
  const [previewURL, setPreviewURL] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // 픽셀 아트 스타일
  const FIXED_PIXEL_ART_STYLE =
    "26x36 pixel size, big-headed cute character style, crisp outlines, subtle shading for a lively chibi look, charming proportions, full-body figure, pure white background, facing left in a walking pose with a slightly dynamic posture";

  // 파일 선택 시
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFile(e.target.files[0]);
  };

  // 파일이 바뀔 때마다 미리보기 URL 생성/정리
  useEffect(() => {
    if (!selectedFile) {
      setPreviewURL("");
      return;
    }

    const objectURL = URL.createObjectURL(selectedFile);
    setPreviewURL(objectURL);

    return () => {
      URL.revokeObjectURL(objectURL);
    };
  }, [selectedFile]);

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
      // console.log(replicatePrompt);

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
      // console.log(generatedImage);
    } catch (err) {
      alert("아바타 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="
        flex 
        h-full 
        flex-col 
        items-center 
        justify-center 
        bg-black p-8 
        text-white
      "
    >
      {/* 로고 */}
      <div className="fixed top-10">
        <Image
          src="/logo/pixona_logo.png"
          alt="Pixona"
          width={200}
          height={200}
        />
      </div>

      {/* 업로드 & 버튼 영역 */}
      <div
        className="
          flex
          min-h-[40dvh] 
          min-w-[40dvw] 
          flex-col
          items-center
          rounded-2xl
          border
          border-white
          bg-[rgba(50,50,50,0.5)]
          p-8
        "
      >
        {/* 파일 업로드 */}
        <div className="mb-4 flex w-full gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="
              flex-1 
              cursor-pointer 
              rounded-lg 
            border 
              bg-[rgba(50,50,50,0.5)] 
            text-xl
              text-white
            "
          />
          {/* 아바타 생성 버튼 */}
          <Button
            onClick={handleGenerateAvatar}
            disabled={!selectedFile || isLoading}
            className="border 
            text-xl 
            hover:bg-[rgba(100,100,100,0.7)]
            "
          >
            아바타 생성하기
          </Button>
        </div>

        {/* 선택된 파일 미리보기 */}
        {previewURL && (
          <div className="mb-4">
            <p className="text-m mb-2 text-gray-300">선택된 파일 미리보기</p>
            {/* 여기서는 Next.js Image 대신 <img> 사용 (원본 객체 URL) */}
            <img
              src={previewURL}
              alt="미리보기"
              className="size-40 rounded-md border border-gray-200 object-cover"
            />
          </div>
        )}
      </div>

      {/* 로딩 스피너 (isLoading = true 인 동안 표시) */}
      {isLoading && (
        <div className="absolute flex size-full flex-col items-center justify-center gap-2 bg-[rgba(0,0,0,0.6)]">
          <div className="size-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p>아바타 생성 중...</p>
        </div>
      )}

      {/* 최종 생성된 이미지 */}
      {generatedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 어두운 배경(overlay) */}
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)]"
            onClick={() => setGeneratedImage("")} // 배경 클릭 시 닫기
          />

          {/* 모달로 표시 */}
          <div className="relative z-50 w-4/5 max-w-xl rounded-lg border bg-[rgba(0,0,0,0.6)] p-6 text-white shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-4xl font-bold hover:text-gray-400"
              onClick={() => setGeneratedImage("")}
            >
              &times;
            </button>

            <h2 className="mb-4 text-2xl font-bold text-fuchsia-500">
              생성된 아바타 이미지
            </h2>

            {/* 생성된 이미지 */}
            <img src={generatedImage} alt="avatar" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
