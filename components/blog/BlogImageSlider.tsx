import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export default function BlogImageSlider({ images, alt }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [images]);

  return (
    <div
      className="pic-blo4 hov-img-zoom bo-rad-10 pos-relative"
      style={{ position: "relative", width: "100%", aspectRatio: "2 / 1" }}
    >
      <Image
        src={`/images/${images[index]}`}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 75vw"
        style={{ objectFit: "cover" }}
        priority={index === 0}
      />

      {/* DOT INDICATORS */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
          }}
        >
          {images.map((_, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                transition: "0.3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
