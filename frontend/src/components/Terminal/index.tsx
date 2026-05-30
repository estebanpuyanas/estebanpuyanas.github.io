import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

/* ─── Types ──────────────────────────────────────────────────── */
interface OutputLine {
  id: number;
  type: "input" | "output" | "error" | "banner" | "section-header" | "blank";
  content: string;
}

/* ─── Constants ──────────────────────────────────────────────── */
const PROMPT = "ep@portfolio:~$ ";

const BANNER_LINES = [
  "███████████████      █████████████  ",
  "███                  ███         ███",
  "███                  ███         ███",
  "███████████████      █████████████  ",
  "███                  ███            ",
  "███                  ███            ",
  "███████████████      ███            ",
  "",
  "esteban puyana portfolio website. use this terminal to navigate and explore.",
  "type 'help' to see available commands",
];

const SECTIONS = ["about", "projects", "music", "travels"];

/* ─── Output line renderer ───────────────────────────────────── */
function renderLine(line: OutputLine) {
  if (line.type === "blank") {
    return <div key={line.id} className="terminal-line terminal-line-blank" />;
  }

  if (line.type === "banner") {
    return (
      <div key={line.id} className="terminal-line terminal-line-banner">
        {line.content}
      </div>
    );
  }

  if (line.type === "input") {
    return (
      <div key={line.id} className="terminal-line terminal-line-input">
        <span className="terminal-prompt">{PROMPT}</span>
        {line.content}
      </div>
    );
  }

  if (line.type === "error") {
    return (
      <div key={line.id} className="terminal-line terminal-line-error">
        {line.content}
      </div>
    );
  }

  if (line.type === "section-header") {
    return (
      <div key={line.id} className="terminal-line terminal-line-header">
        {line.content}
      </div>
    );
  }

  return (
    <div key={line.id} className="terminal-line terminal-line-output">
      {line.content}
    </div>
  );
}

/* ─── Command processor ──────────────────────────────────────── */
function processCommand(
  raw: string,
  navigate: (path: string) => void,
): OutputLine[] {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const id = () => Date.now() + Math.random();

  if (!trimmed) return [];
  if (lower === "clear") return [];

  if (lower === "help") {
    const commands: [string, string][] = [
      ["help", "show this help message"],
      ["about", "short bio"],
      ["ls", "list pages"],
      ["open <page>", "navigate to a page"],
      ["github", "open GitHub profile"],
      ["linkedin", "open LinkedIn profile"],
      ["clear", "clear the terminal"],
    ];
    const lines: OutputLine[] = [
      { id: id(), type: "blank", content: "" },
      { id: id(), type: "section-header", content: "AVAILABLE COMMANDS" },
      {
        id: id(),
        type: "output",
        content: "─────────────────────────────────────────",
      },
    ];
    for (const [cmd, desc] of commands) {
      lines.push({
        id: id(),
        type: "output",
        content: `${cmd.padEnd(20)} ${desc}`,
      });
    }
    lines.push({ id: id(), type: "blank", content: "" });
    return lines;
  }

  if (lower === "about") {
    return [
      { id: id(), type: "blank", content: "" },
      {
        id: id(),
        type: "output",
        content: "Aspiring software engineer with a passion for systems,",
      },
      {
        id: id(),
        type: "output",
        content: "data engineering, and embedded software. Elegant solutions",
      },
      {
        id: id(),
        type: "output",
        content: "from firmware to distributed pipelines.",
      },
      {
        id: id(),
        type: "output",
        content: "Outside code: squash, chess, and music writing.",
      },
      { id: id(), type: "blank", content: "" },
    ];
  }

  if (lower === "ls") {
    return [
      { id: id(), type: "blank", content: "" },
      { id: id(), type: "output", content: SECTIONS.join("   ") },
      { id: id(), type: "blank", content: "" },
    ];
  }

  if (lower === "github") {
    window.open(
      "https://github.com/estebanpuyanas",
      "_blank",
      "noopener,noreferrer",
    );
    return [
      { id: id(), type: "blank", content: "" },
      {
        id: id(),
        type: "output",
        content: "Opening github.com/estebanpuyanas ...",
      },
      { id: id(), type: "blank", content: "" },
    ];
  }

  if (lower === "linkedin") {
    window.open(
      "https://linkedin.com/in/estebanpuyanas",
      "_blank",
      "noopener,noreferrer",
    );
    return [
      { id: id(), type: "blank", content: "" },
      {
        id: id(),
        type: "output",
        content: "Opening linkedin.com/in/estebanpuyanas ...",
      },
      { id: id(), type: "blank", content: "" },
    ];
  }

  if (lower.startsWith("open ")) {
    const target = lower.slice(5).trim();
    if (SECTIONS.includes(target)) {
      navigate(`/${target}`);
      return [
        { id: id(), type: "blank", content: "" },
        { id: id(), type: "output", content: `Navigating to /${target} ...` },
        { id: id(), type: "blank", content: "" },
      ];
    }
    return [
      { id: id(), type: "blank", content: "" },
      {
        id: id(),
        type: "error",
        content: `open: no page '${target}' — try: ${SECTIONS.join(", ")}`,
      },
      { id: id(), type: "blank", content: "" },
    ];
  }

  return [
    { id: id(), type: "blank", content: "" },
    { id: id(), type: "error", content: `command not found: ${trimmed}` },
    { id: id(), type: "output", content: "type 'help' for a list of commands" },
    { id: id(), type: "blank", content: "" },
  ];
}

/* ─── Terminal Component ─────────────────────────────────────── */
export default function Terminal() {
  const navigate = useNavigate();
  const uid = useRef(0);
  const nextId = () => ++uid.current;

  const makeBannerLines = (): OutputLine[] => {
    const result: OutputLine[] = BANNER_LINES.map((content) => ({
      id: nextId(),
      type: content === "" ? "blank" : "banner",
      content,
    }));
    result.push({ id: nextId(), type: "blank", content: "" });
    return result;
  };

  const [lines, setLines] = useState<OutputLine[]>(() => makeBannerLines());
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [_historyIdx, setHistoryIdx] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
    setFocused(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const raw = input.trim();
    const echoLine: OutputLine = {
      id: nextId(),
      type: "input",
      content: input,
    };

    if (raw.toLowerCase() === "clear") {
      setLines(makeBannerLines());
      setInput("");
      setHistoryIdx(-1);
      if (raw) setHistory((h) => [raw, ...h]);
      return;
    }

    const result = processCommand(raw, navigate);
    setLines((prev) => [...prev, echoLine, ...result]);
    if (raw) setHistory((h) => [raw, ...h]);
    setInput("");
    setHistoryIdx(-1);
  }, [input, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistoryIdx((idx) => {
          const next = Math.min(idx + 1, history.length - 1);
          setInput(history[next] ?? "");
          return next;
        });
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistoryIdx((idx) => {
          const next = Math.max(idx - 1, -1);
          setInput(next === -1 ? "" : (history[next] ?? ""));
          return next;
        });
        return;
      }

      if (e.key === "c" && e.ctrlKey) {
        e.preventDefault();
        setLines((prev) => [
          ...prev,
          { id: nextId(), type: "input", content: input + "^C" },
        ]);
        setInput("");
        setHistoryIdx(-1);
        return;
      }

      if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setLines(makeBannerLines());
        return;
      }
    },
    [handleSubmit, history, input],
  );

  const cursorActive = focused || hovered;

  return (
    <div
      className="terminal-wrapper"
      onClick={focusInput}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="terminal-title-bar" onClick={(e) => e.stopPropagation()}>
        <span className="terminal-title-text">esteban@portfolio ~ — zsh</span>
      </div>

      <div ref={outputRef} className="terminal-output-area">
        {lines.map((line) => renderLine(line))}
      </div>

      <div className="terminal-input-row">
        <span className="terminal-prompt-label">{PROMPT}</span>
        <div className="terminal-input-display">
          <span>{input}</span>
          <span
            className={`terminal-cursor${cursorActive ? " terminal-cursor--active" : ""}`}
          />
          <input
            ref={inputRef}
            className="terminal-hidden-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setHistoryIdx(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="terminal input"
          />
        </div>
      </div>
    </div>
  );
}
