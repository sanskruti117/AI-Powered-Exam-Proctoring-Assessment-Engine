"use client";

import React, { useState, useEffect } from "react";

interface AnimatedTypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  cursorColor?: string;
  showCursor?: boolean;
}

export function AnimatedTypewriterText({
  text,
  speed = 45,
  className = "",
  cursorColor = "text-indigo-400",
  showCursor = true,
}: AnimatedTypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsDone(false);

    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
      {showCursor && (
        <span
          className={`inline-block ml-1 font-mono font-normal transition-opacity duration-150 ${
            cursorColor
          } ${isDone ? "animate-pulse" : "opacity-100"}`}
        >
          |
        </span>
      )}
    </span>
  );
}
