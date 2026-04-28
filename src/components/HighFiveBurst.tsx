"use client";
import { useEffect, useState } from "react";
import { PawMark } from "./PawMark";

interface Props {
  trigger: number | null;
  color?: string;
  label?: string;
}

export function HighFiveBurst({ trigger, color = "var(--accent)", label = "High five!" }: Props) {
  const [active, setActive] = useState(false);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (trigger == null) return;
    setActive(true);
    setKey((k) => k + 1);
    const t = setTimeout(() => setActive(false), 1100);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!active) return null;
  return (
    <div
      key={key}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 200,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: 220, height: 220 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}22 0%, ${color}00 60%)`,
            animation: "hi5-burst 0.9s ease-out forwards",
          }}
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div
            key={deg}
            style={
              {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 8,
                height: 8,
                marginLeft: -4,
                marginTop: -4,
                background: color,
                borderRadius: "50%",
                opacity: 0,
                "--rot": `rotate(${deg}deg)`,
                animation: `hi5-spark 0.95s ${(deg / 360) * 0.1}s ease-out forwards`,
              } as React.CSSProperties
            }
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: -36,
            marginTop: -36,
            animation: "hi5-paw 1.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <PawMark size={72} color={color} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: -36,
            marginTop: -36,
            transform: "scaleY(-1)",
            transformOrigin: "center",
            animation: "hi5-hand 1.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <PawMark size={72} color={color} opacity={0.45} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -10,
            padding: "6px 14px",
            borderRadius: 999,
            background: color,
            color: "#fff",
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontSize: 16,
            fontWeight: 500,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 16px ${color}44`,
            animation: "hi5-label 1.1s ease-out forwards",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
