import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  images: string[];
};

export default function EventGallery({ images }: Props) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // 👉 change image with fade
  const changeImage = (i: number) => {
    setFade(false);

    setTimeout(() => {
      setIndex(i);
      setFade(true);
    }, 200);
  };

  // 👉 AUTO SLIDE
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      changeImage((index + 1) % images.length);
    }, 3000); // ⏱ 3 seconds

    return () => clearInterval(interval);
  }, [index, images.length]);

  return (
    <div
      className="bo-rad-10 of-hidden pos-relative"
      style={{ width: "100%", maxWidth: 600, aspectRatio: "3 / 2", position: "relative" }}
    >
      <Image
        key={index}
        src={`/images/${images[index]}`}
        alt="Event image"
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        style={{
          objectFit: "cover",
          objectPosition: "center",
          opacity: fade ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />

      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
          }}
        >
          {images.map((_, i) => (
            <span
              key={i}
              onClick={() => changeImage(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
