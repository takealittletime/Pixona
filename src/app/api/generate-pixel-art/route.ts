// src/app/api/generate-pixel-art/route.ts
// langchain, dotenv 등 필요한 라이브러리 임포트
// (실제로 사용 중인 라이브러리에 맞춰 import 문을 수정하세요)
import { config } from "dotenv";
import { NextRequest, NextResponse } from "next/server";
config();

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    // req.json()으로 바디 파싱
    const { pixel_art_style, person_description } = await req.json();

    // system_message
    const systemMessage = SystemMessagePromptTemplate.fromTemplate(`
You are a pixel art prompt expert.
Based on the description below (pixel art style reference/character description),
please write the final prompt that can be directly input into DALL·E.

Conditions:
- Refer to the pixel art style with vibrant, lively details.
- Depict the person as a character in that natural, slightly dynamic style.
- The final output should be a single prompt sentence.
- Provide as much detail as possible about composition, layout, palette, and resolution.
- Only one character should be presented.
- The character should be facing to the left in a walking pose, with a bit of dynamic movement.
- The character should be depicted as a full-body figure.
- Use a pure white background, and do not include any other objects.
`);

    // human_message prompt
    const humanMessage = HumanMessagePromptTemplate.fromTemplate(`
Pixel art style description: {pixel_art_style}
Character description: {person_description}

Please create the final DALL·E prompt that reflects both of the above.
`);

    // prompt 템플릿 생성
    const chatPrompt = ChatPromptTemplate.fromMessages([
      systemMessage,
      humanMessage,
    ]);

    // LLM 인스턴스 생성 (OpenAI API Key 필요)
    const llm = new ChatOpenAI({
      temperature: 0.2,
      modelName: "gpt-4-0613",
      apiKey: process.env.OPENAI_API_KEY,
    });

    // chatPrompt와 llm을 연결해서 결과 얻기
    const chain = chatPrompt.pipe(llm);
    const result = await chain.invoke({
      pixel_art_style,
      person_description,
    });

    // 최종 프롬프트 텍스트 추출
    const promptText = result.content;

    // DALL-E API 호출
    const openai = new OpenAI();
    const response = await openai.images.generate({
      prompt: promptText,
      n: 1,
      size: "1024x1024",
    });
    const imageUrl = response.data[0].url;

    // JSON 형태로 응답
    return NextResponse.json({
      success: true,
      promptText,
      imageUrl,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Something went wrong",
      },
      { status: 500 },
    );
  }
}
