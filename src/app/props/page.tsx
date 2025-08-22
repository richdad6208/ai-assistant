"use client";

import { useState } from "react";
import { notifications } from "@mantine/notifications";

type PropRow = {
  name: string;
  type: string;
  customType?: string;
  stateType?: string;
};

const TYPE_OPTIONS = [
  "string",
  "number",
  "boolean",
  "ReactNode",
  "any",
  "unknown",
  "null",
  "undefined",
  "Date",
  "string[]",
  "number[]",
  "boolean[]",
  "Record<string, any>",
  "Custom",
  "setState",
];

function toInterfaceName(name: string) {
  return `${name}Props`;
}

function ensureReactDispatchImport(source: string) {
  const hasReactImport = /import\s*{[^}]*}\s*from\s*["']react["'];?/.test(
    source
  );
  if (hasReactImport) {
    return source.replace(
      /import\s*{([^}]*)}\s*from\s*["']react["'];?/,
      (_m, g1) => {
        const list = g1
          .split(",")
          .map((s: any) => s.trim())
          .filter(Boolean);
        const need = new Set(list);
        need.add("Dispatch");
        need.add("SetStateAction");
        return `import { ${Array.from(need).join(", ")} } from "react";`;
      }
    );
  }
  return `import { Dispatch, SetStateAction } from "react";\n${source}`;
}

export default function PropsInjectorPage() {
  const [input, setInput] = useState(
    `export default function Panel() {
  return (<div></div>);
}`
  );
  const [props, setProps] = useState<PropRow[]>([{ name: "", type: "string" }]);
  const [output, setOutput] = useState("");

  const onChangeProp = (idx: number, field: keyof PropRow, v: string) => {
    const next = [...props];
    (next[idx] as any)[field] = v;
    setProps(next);
  };
  const addProp = () => setProps((p) => [...p, { name: "", type: "string" }]);
  const removeProp = (idx: number) =>
    setProps((p) => p.filter((_, i) => i !== idx));

  const generate = async () => {
    const compMatch = input.match(
      /export\s+default\s+function\s+(\w+)\s*\(([^)]*)\)/
    );
    if (!compMatch) {
      notifications.show({
        title: "파싱 실패",
        message: "컴포넌트 선언을 찾지 못했어요.",
        color: "red",
      });
      return;
    }
    const compName = compMatch[1];
    const ifaceName = toInterfaceName(compName);

    // props 변환
    const valid = props
      .filter((p) => p.name.trim())
      .map((p) => {
        if (p.type === "Custom") {
          return { name: p.name.trim(), type: (p.customType || "any").trim() };
        }
        if (p.type === "setState") {
          const inner = (p.stateType || "any").trim();
          return {
            name: p.name.trim(),
            type: `Dispatch<SetStateAction<${inner}>>`,
          };
        }
        return { name: p.name.trim(), type: p.type.trim() };
      });

    let newCode = input;

    // 인터페이스 블록 준비
    const ifaceBody = valid.map((v) => `${v.name}: ${v.type};`).join("\n  ");
    const interfaceBlock = `interface ${ifaceName} {\n  ${ifaceBody}\n}\n\n`;

    // 함수 시그니처 교체
    newCode = newCode.replace(
      new RegExp(
        `export\\s+default\\s+function\\s+${compName}\\s*\\(([^)]*)\\)`
      ),
      (_m, params) => {
        const names = params
          .replace(/^[^{]*\{?|\}?[^}]*$/g, "")
          .split(",")
          .map((s: any) => s.replace(/[:?].*$/, "").trim())
          .filter(Boolean);

        const addNames = valid.map((v) => v.name);
        const all = Array.from(new Set([...names, ...addNames]));
        return `export default function ${compName}({ ${all.join(
          ", "
        )} }: ${ifaceName})`;
      }
    );

    // 함수 위에 인터페이스 삽입 (기존 인터페이스는 제거)
    if (new RegExp(`interface\\s+${ifaceName}`).test(newCode)) {
      // 기존 인터페이스 추출 및 병합
      newCode = newCode.replace(
        new RegExp(`interface\\s+${ifaceName}\\s*{([\\s\\S]*?)}\\s*`),
        (_m, body) => {
          const existingFields = body
            .split("\n")
            .map((l: any) => l.trim())
            .filter(Boolean);

          const existingNames = existingFields.map((l: any) =>
            l.split(":")[0].trim()
          );
          const additions = valid
            .filter((v) => !existingNames.includes(v.name))
            .map((v) => `  ${v.name}: ${v.type};`);

          const merged = [
            ...existingFields.map((f: any) => `  ${f}`),
            ...additions,
          ].join("\n");
          return `interface ${ifaceName} {\n${merged}\n}\n`;
        }
      );
    } else {
      // 인터페이스 없으면 새로 생성
      const ifaceBody = valid.map((v) => `${v.name}: ${v.type};`).join("\n  ");
      const interfaceBlock = `interface ${ifaceName} {\n  ${ifaceBody}\n}\n\n`;
      newCode = newCode.replace(
        new RegExp(`(export\\s+default\\s+function\\s+${compName})`),
        `${interfaceBlock}$1`
      );
    }
    // setState 타입 사용 시 import 보장
    if (valid.some((v) => v.type.startsWith("Dispatch<SetStateAction<"))) {
      newCode = ensureReactDispatchImport(newCode);
    }

    setOutput(newCode);
    await navigator.clipboard.writeText(newCode);
    notifications.show({
      title: "완료",
      message: "Props 주입 & 복사 완료 ✅",
      color: "teal",
    });
  };

  // ⌨️ 엔터 동작: textarea에서는 Ctrl/⌘+Enter만 실행, 그 외 인풋에선 Enter로 실행
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    const isTextarea = tag === "textarea";
    if (isTextarea) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        generate();
      }
    }
  };

  return (
    <div className="flex gap-8 p-6" onKeyDown={handleKeyDown}>
      <div className="flex flex-col gap-3 w-[640px]">
        <h1 className="text-xl font-semibold">Props 주입기</h1>

        <label className="font-medium">컴포넌트 코드 (Ctrl/⌘+Enter 실행)</label>
        <textarea
          className="border rounded p-2 h-[220px] font-mono"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <label className="font-medium">Props 추가</label>
        <div className="flex flex-col gap-2">
          {props.map((p, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="이름"
                value={p.name}
                onChange={(e) => onChangeProp(idx, "name", e.target.value)}
                className="border p-2 rounded w-[30%]"
              />
              <select
                value={p.type}
                onChange={(e) => onChangeProp(idx, "type", e.target.value)}
                className="border p-2 rounded w-[30%] bg-white"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {p.type === "Custom" && (
                <input
                  type="text"
                  placeholder="Custom 타입"
                  value={p.customType || ""}
                  onChange={(e) =>
                    onChangeProp(idx, "customType", e.target.value)
                  }
                  className="border p-2 rounded w-[30%]"
                />
              )}
              {p.type === "setState" && (
                <input
                  type="text"
                  placeholder="상태 타입 (예: string)"
                  value={p.stateType || ""}
                  onChange={(e) =>
                    onChangeProp(idx, "stateType", e.target.value)
                  }
                  className="border p-2 rounded w-[30%]"
                />
              )}
              <button
                onClick={() => removeProp(idx)}
                className="bg-red-500 text-white px-2 py-2 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addProp}
            className="bg-gray-200 rounded px-3 py-2 hover:bg-gray-300 w-fit"
          >
            + Prop 추가
          </button>
        </div>

        <button
          onClick={generate}
          className="bg-[#0091bc] text-white rounded py-2 hover:bg-[#007a9e] mt-3"
        >
          Props 주입 & 복사
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <label className="font-medium">결과</label>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap mt-2 flex-1 font-mono text-sm">
          {output}
        </pre>
      </div>
    </div>
  );
}
