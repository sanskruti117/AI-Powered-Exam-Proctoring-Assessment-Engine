"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number | string;
  duration?: number; // ms
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    typeof value === "number" ? "0" : value.toString()
  );
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef<boolean>(false);

  useEffect(() => {
    // Extract numerical part, prefix, suffix, and decimals
    const strVal = value.toString().trim();
    const match = strVal.match(/^([^0-9.-]*)([0-9.,]+)(.*)$/);

    if (!match) {
      setDisplayValue(strVal);
      return;
    }

    const prefix = match[1] || "";
    const rawNumStr = match[2].replace(/,/g, "");
    const suffix = match[3] || "";
    const targetNumber = parseFloat(rawNumStr);

    if (isNaN(targetNumber)) {
      setDisplayValue(strVal);
      return;
    }

    const hasComma = match[2].includes(",");
    const decimalPlaces = (rawNumStr.split(".")[1] || "").length;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentNumber = easeProgress * targetNumber;

      let formattedNum = currentNumber.toFixed(decimalPlaces);
      if (hasComma) {
        const parts = formattedNum.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        formattedNum = parts.join(".");
      }

      setDisplayValue(`${prefix}${formattedNum}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(strVal);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animationFrameId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return (
    <span ref={elementRef} className={className}>
      {displayValue}
    </span>
  );
}
