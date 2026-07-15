import { useEffect, useState } from "react";
import { getFooter } from "@/services/publicPageService";

export default function LandingFooter() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    getFooter().then((res) => {
      setHtml(res.data.data.contents);
    });
  }, []);

  if (!html) return null;

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
