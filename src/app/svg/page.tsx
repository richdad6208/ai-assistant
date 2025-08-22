"use client";

import { useState } from "react";
import { notifications } from "@mantine/notifications";

export default function HomePage() {
  const [name, setName] = useState("");
  const [svg, setSvg] = useState("");
  const [output, setOutput] = useState("");
  const [color, setColor] = useState("#7B7B7B");

  const generate = async () => {
    if (!name || !svg) {
      notifications.show({
        title: "입력 오류",
        message: "아이콘 이름과 SVG 코드를 입력하세요!",
        color: "red",
      });
      return;
    }

    let replacedSvg = svg
      .replace(/stroke="#[0-9A-Fa-f]{3,6}"/g, "stroke={color}")
      .replace(/fill="#[0-9A-Fa-f]{3,6}"/g, "fill={color}")
      .replace(/stroke="black"/g, "stroke={color}")
      .replace(/fill="black"/g, "fill={color}");

    replacedSvg = replacedSvg
      .replace(/stroke-width=/g, "strokeWidth=")
      .replace(/stroke-linecap=/g, "strokeLinecap=")
      .replace(/stroke-linejoin=/g, "strokeLinejoin=")
      .replace(/fill-rule=/g, "fillRule=")
      .replace(/clip-rule=/g, "clipRule=");

    const result = `export const ${name} = ({ color = "${color}" }: Icon) => {
  return (
    ${replacedSvg}
  );
};`;

    setOutput(result);

    try {
      await navigator.clipboard.writeText(result);
      notifications.show({
        title: "복사 완료",
        message: "변환된 코드가 클립보드에 복사되었습니다 ✅",
        color: "teal",
      });
    } catch (err) {
      notifications.show({
        title: "실패",
        message: "클립보드 복사에 실패했습니다",
        color: "red",
      });
    }
  };

  return (
    <div className="flex gap-8 p-20">
      <div className="flex flex-col gap-4 w-[400px]">
        <label>아이콘 이름:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: IconNavigation"
          className="border p-2 rounded"
        />

        <label>color 기본값:</label>
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#7B7B7B"
          className="border p-2 rounded"
        />

        <label>SVG 코드:</label>
        <textarea
          value={svg}
          onChange={(e) => setSvg(e.target.value)}
          placeholder="<svg ...>...</svg>"
          className="border p-2 rounded h-[200px]"
        />

        <button
          onClick={generate}
          className="bg-[#0091bc] text-white rounded py-2 hover:bg-[#007a9e]"
        >
          변환하기 & 복사하기
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <label>React Icon 컴포넌트:</label>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap mt-2 flex-1">
          {output}
        </pre>
      </div>
    </div>
  );
}
