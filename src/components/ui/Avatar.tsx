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

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center text-white font-bold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: isCompany ? 8 : "50%",
        background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, ${color}, ${color}dd)`,
        fontSize: size * 0.38,
        letterSpacing: "0.5px",
        border: isCompany ? `2px solid ${color}40` : "none",
      }}
    >
      {!src && initials}
    </div>
  );
}
