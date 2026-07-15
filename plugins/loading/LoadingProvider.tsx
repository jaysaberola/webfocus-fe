"use client";

import { useEffect, useState } from "react";
import LoadingOverlay from "@/components/UI/LoadingOverlay";
import { registerLoading } from "./index";

export default function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("Loading...");

  const start = (message?: string) => {
    if (message) setText(message);
    setLoading(true);
  };

  const finish = () => {
    setLoading(false);
    setText("Loading...");
  };

  // 👇 MUST run immediately after mount
  useEffect(() => {
    registerLoading({ start, finish });
  }, []);

  return (
    <>
      {children}
      <LoadingOverlay loading={loading} text={text} />
    </>
  );
}
