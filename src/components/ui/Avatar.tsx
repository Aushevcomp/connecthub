"use client";

import { getInitials, getAvatarColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: number;
  src?: string | null;
  isCompany?: boolean;
  className?: string;
}

export function Avatar({ name, size = 40, src, isCompany, className = "" }: AvatarProps) {
  const color = getAvatarColor(name);
  const initials = getInitials(name);
  const radius = isCompany ? "20%" : "50%";

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: src ? undefined : `linear-gradient(135deg, ${color}, ${color}dd)`,
        fontSize: size * 0.38,
        letterSpacing: "0.5px",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}