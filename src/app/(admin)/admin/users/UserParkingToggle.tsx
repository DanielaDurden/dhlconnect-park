"use client";

import { useState } from "react";

interface Props {
  userId: string;
  hasParking: boolean;
}

export default function UserParkingToggle({ userId, hasParking }: Props) {
  const [value, setValue] = useState(hasParking);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !value;
    try {
      const res = await fetch("/api/admin/user-parking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, has_parking: next }),
      });
      if (res.ok) setValue(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        value ? "bg-green-500" : "bg-dhl-mid-gray"
      } ${loading ? "opacity-50" : ""}`}
      aria-label={value ? "Quitar acceso a parking" : "Dar acceso a parking"}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
