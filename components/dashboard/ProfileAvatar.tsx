"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { getAvatar, subscribeToAvatar } from "@/lib/avatar";

export default function ProfileAvatar({ size = 36 }: { size?: number }) {
  const [avatar, setAvatarState] = useState<string | null>(() => getAvatar());

  useEffect(() => {
    return subscribeToAvatar(() => setAvatarState(getAvatar()));
  }, []);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-border bg-accent-2 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt="Profile"
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <UserCircle size={Math.round(size * 0.72)} className="text-accent-ink" />
      )}
    </div>
  );
}