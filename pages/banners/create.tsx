import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import { BannerForm } from "@/schemas/banner";
import { OptionItem, getOptions } from "@/services/optionService";
import { createAlbum } from "@/services/albumService";
import { toast } from "@/lib/toast";
import Tooltip from "@/components/UI/Tooltip";

type BannerType = "image" | "video";

function CreateAlbum() {
  const router = useRouter();

  /* ======================
   * State
   * ====================== */
  const [name, setName] = useState("");
  const [transitionIn, setTransitionIn] = useState("");
  const [transitionOut, setTransitionOut] = useState("");
  const [duration, setDuration] = useState(2);
  const [bannerType, setBannerType] = useState<BannerType>("image");

  const [banners, setBanners] = useState<BannerForm[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const [entranceOptions, setEntranceOptions] = useState<OptionItem[]>([]);
  const [exitOptions, setExitOptions] = useState<OptionItem[]>([]);
  const isVideoBanner = (banner: BannerForm) => {
    if (banner.media_type === "video") return true;
    if (banner.image instanceof File && banner.image.type.startsWith("video/")) return true;
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(banner.preview ?? ""));
  };

  /* ======================
   * Load options
   * ====================== */
  useEffect(() => {
    getOptions({ type: "animation", field_type: "entrance" })
      .then((res: any) => setEntranceOptions(res.data.data));

    getOptions({ type: "animation", field_type: "exit" })
      .then((res: any) => setExitOptions(res.data.data));
  }, []);

  /* ======================
   * Image upload
   * ====================== */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newBanners: BannerForm[] = Array.from(files).map((file) => ({
      image: file,
      preview: URL.createObjectURL(file),
      media_type: file.type.startsWith("video/") ? "video" : bannerType,
    }));

    setBanners((prev) => [...prev, ...newBanners]);

    // allow re-selecting same file
    e.target.value = "";
  };

  const handleRemoveBanner = (index: number) => {
    setBanners((prev) => {
      const banner = prev[index];
      if (banner.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(banner.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
    try {
      e.dataTransfer?.setData("text/plain", String(index));
    } catch {}
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      setDraggingIndex(null);
      dragIndexRef.current = null;
      return;
    }

    setBanners((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });

    setDraggingIndex(null);
    dragIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    dragIndexRef.current = null;
  };

  const updateBanner = (
    index: number,
    field: keyof BannerForm,
    value: any
  ) => {
    setBanners((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  /* ======================
   * Save
   * ====================== */
  const handleSave = async () => {
    if (!name || !transitionIn || !transitionOut || banners.length === 0) {
      toast.error("Please fill in all required fields.")
      return;
    }

    const payload : any = {
      name,
      transition_in: transitionIn,
      transition_out: transitionOut,
      transition: duration,
      banner_type: bannerType,
      banners: banners.map((b, i) => ({
        title: b.title,
        title_font: b.title_font,
        description: b.description,
        description_font: b.description_font,
        button_text: b.button_text,
        button_font: b.button_font,
        url: b.url,
        alt: b.alt,
        order: i,
        image: b.image,
        media_type: isVideoBanner(b) ? "video" : "image",
      })),
    };

    await createAlbum(payload);
    toast.success("Album created successfully!");
    router.push("/banners");
  };

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4 d-flex align-items-center gap-2">
        Create an Album
        <Tooltip text="Create a new banner album containing multiple images that rotate as a slideshow." />
      </h3>

      {/* Album Name */}
      <div className="mb-3">
        <label className="form-label d-flex align-items-center">
          Album Name <span className="text-danger">*</span>
          <Tooltip text="Name used to identify this banner album inside the CMS." />
        </label>
        <input
          className="form-control"
          placeholder="Enter album name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Transition In */}
      <div className="mb-3">
        <label className="form-label d-flex align-items-center">
          Transition In <span className="text-danger">*</span>
          <Tooltip text="Animation used when a banner appears on screen." />
        </label>
        <select
          className="form-control"
          value={transitionIn}
          onChange={(e) => setTransitionIn(e.target.value)}
        >
          <option value="">Select transition</option>
          {entranceOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transition Out */}
      <div className="mb-3">
        <label className="form-label d-flex align-items-center">
          Transition Out <span className="text-danger">*</span>
          <Tooltip text="Animation used when the banner disappears before the next one shows." />
        </label>
        <select
          className="form-control"
          value={transitionOut}
          onChange={(e) => setTransitionOut(e.target.value)}
        >
          <option value="">Select transition</option>
          {exitOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Duration */}
      <div className="mb-3">
        <label className="form-label d-flex align-items-center">
          Transition Duration (seconds) <span className="text-danger">*</span>
          <Tooltip text="How long each banner stays visible before switching to the next." />
        </label>
        <input
          type="range"
          className="form-range"
          min={1}
          max={10}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <small className="text-muted">{duration}s</small>
      </div>

      {/* Banner Type */}
      <div className="mb-3">
        <label className="form-label d-flex align-items-center">
          Banner Type <span className="text-danger">*</span>
          <Tooltip text="Choose whether this album uses image or video banner uploads." />
        </label>
        <div className="form-check">
          <input
            type="radio"
            className="form-check-input"
            id="imageBanner"
            checked={bannerType === "image"}
            onChange={() => setBannerType("image")}
          />
          <label className="form-check-label" htmlFor="imageBanner">
            Image
          </label>
        </div>
        <div className="form-check">
          <input
            type="radio"
            className="form-check-input"
            id="videoBanner"
            checked={bannerType === "video"}
            onChange={() => setBannerType("video")}
          />
          <label className="form-check-label" htmlFor="videoBanner">
            Video
          </label>
        </div>
      </div>

      {/* Upload Media */}
      <div className="mb-4">
        <label className="form-label d-flex align-items-center">
          {bannerType === "video" ? "Album Videos" : "Album Images"} <span className="text-danger">*</span>
          <Tooltip text={bannerType === "video" ? "Upload one or more videos that will appear in this banner album slideshow." : "Upload one or more images that will appear in this banner album slideshow."} />
        </label>
        <button
          type="button"
          className="btn btn-outline-secondary d-block"
          onClick={() => document.getElementById("imageUpload")?.click()}
        >
          {bannerType === "video" ? "Upload Videos" : "Upload Images"}
          <Tooltip text={bannerType === "video" ? "Select multiple videos from your device to add to this banner album." : "Select multiple images from your device to add to this banner album."} />
        </button>

        <input
          id="imageUpload"
          type="file"
          className="d-none"
          multiple
          accept={bannerType === "video" ? "video/*" : "image/*"}
          onChange={handleImageUpload}
        />
      </div>

      {/* Preview banners */}
      {banners.length > 0 && (
        <div className="row mb-4">
          {banners.map((banner, index) => (
            <div key={index} className="col-md-4 mb-4">
              <div
                className={`card h-100 cms-banner-card ${draggingIndex === index ? "cms-banner-card--dragging" : ""}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(index, e)}
              >
                <div
                  className="cms-banner-drag-handle"
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                  draggable
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragEnd={handleDragEnd}
                >
                  <i className="fa-solid fa-grip-lines" />
                </div>

                {isVideoBanner(banner) ? (
                  <video
                    src={banner.preview}
                    className="card-img-top"
                    muted
                    loop
                    playsInline
                    controls
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ height: 200, objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src={banner.preview}
                    className="card-img-top"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ height: 200, objectFit: "cover" }}
                  />
                )}

                <div className="card-body">
                  <div className="mb-2">
                    <label className="form-label d-flex align-items-center">
                      Title
                      <Tooltip text="Headline text displayed on top of the banner image." />
                    </label>
                    <input
                      className="form-control"
                      value={banner.title || ""}
                      onChange={(e) =>
                        updateBanner(index, "title", e.target.value)
                      }
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label d-flex align-items-center">
                      Description
                      <Tooltip text="Optional supporting text displayed below the banner title." />
                    </label>
                    <textarea
                      className="form-control"
                      value={banner.description || ""}
                      onChange={(e) =>
                        updateBanner(index, "description", e.target.value)
                      }
                    />
                  </div>

                  <button
                    className="btn btn-outline-danger btn-sm mt-2"
                    onClick={() => handleRemoveBanner(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={handleSave}>
          Save Album
          <Tooltip text="Save this album and its banners to the system." />
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => router.back()}
        >
          Cancel
          <Tooltip text="Discard changes and return to the album list." />
        </button>
      </div>
    </div>
  );
}

CreateAlbum.Layout = AdminLayout;
export default CreateAlbum;
