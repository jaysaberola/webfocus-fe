import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import { BannerForm } from "@/schemas/banner";
import { OptionItem, getOptions } from "@/services/optionService";
import { createAlbum } from "@/services/albumService";
import { toast } from "@/lib/toast";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsChoicePills,
  CmsSettingsField,
  CmsSettingsFooter,
  CmsSettingsGrid,
  CmsSettingsLayout,
  CmsSettingsSection,
  CmsSettingsUploadZone,
} from "@/components/Modules/CmsSettingsForm";

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
  const [mediaDragOver, setMediaDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const appendMediaFiles = (files: FileList | File[]) => {
    const newBanners: BannerForm[] = Array.from(files).map((file) => ({
      image: file,
      preview: URL.createObjectURL(file),
      media_type: file.type.startsWith("video/") ? "video" : bannerType,
    }));

    setBanners((prev) => [...prev, ...newBanners]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    appendMediaFiles(files);

    // allow re-selecting same file
    e.target.value = "";
  };

  const handleMediaDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setMediaDragOver(false);
    if (event.dataTransfer.files?.length) {
      appendMediaFiles(event.dataTransfer.files);
    }
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
    <CmsModuleShell
      title="Create an Album"
      description="Create a banner album with slideshow transitions and multiple image or video slides."
      icon="fa-solid fa-images"
      stats={[
        { label: "Album", value: name.trim() || "Untitled" },
        { label: "Slides", value: banners.length, tone: "accent" },
        { label: "Type", value: bannerType === "video" ? "Video" : "Image" },
        { label: "Duration", value: `${duration}s` },
      ]}
    >
      <CmsSettingsLayout>
        <CmsSettingsSection
          title="Album Settings"
          description="Name the album and configure slideshow transitions."
          icon="fa-solid fa-sliders"
        >
          <CmsSettingsGrid columns={2}>
            <CmsSettingsField label="Album Name" required span={2}>
              <input
                className="form-control"
                placeholder="Enter album name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </CmsSettingsField>
            <CmsSettingsField label="Transition In" required>
              <select
                className="form-select"
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
            </CmsSettingsField>
            <CmsSettingsField label="Transition Out" required>
              <select
                className="form-select"
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
            </CmsSettingsField>
            <CmsSettingsField label="Transition Duration" required hint={`Each slide stays visible for ${duration} seconds.`}>
              <input
                type="range"
                className="form-range"
                min={1}
                max={10}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </CmsSettingsField>
            <CmsSettingsChoicePills
              label="Banner Type"
              value={bannerType}
              onChange={setBannerType}
              options={[
                { value: "image", label: "Image", icon: "fa-solid fa-image" },
                { value: "video", label: "Video", icon: "fa-solid fa-video" },
              ]}
            />
          </CmsSettingsGrid>
        </CmsSettingsSection>

        <CmsSettingsSection
          title={bannerType === "video" ? "Album Videos" : "Album Images"}
          description="Upload one or more files. Drag slides to reorder them."
          icon="fa-solid fa-photo-film"
        >
          <CmsSettingsUploadZone
            label={bannerType === "video" ? "Drop videos here or browse files" : "Drop images here or browse files"}
            hint={bannerType === "video" ? "MP4, WebM, or other supported video formats" : "JPG, PNG, or other supported image formats"}
            accept={bannerType === "video" ? "video/*" : "image/*"}
            multiple
            dragOver={mediaDragOver}
            onDragOver={(event) => {
              event.preventDefault();
              setMediaDragOver(true);
            }}
            onDragLeave={() => setMediaDragOver(false)}
            onDrop={handleMediaDrop}
            onBrowse={() => fileInputRef.current?.click()}
            inputRef={fileInputRef}
            onInputChange={handleImageUpload}
          />

          {banners.length > 0 && (
            <div className="row g-3 mt-3">
              {banners.map((banner, index) => (
                <div key={index} className="col-md-6 col-xl-4">
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
                        alt=""
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{ height: 200, objectFit: "cover" }}
                      />
                    )}

                    <div className="card-body">
                      <CmsSettingsField label="Title">
                        <input
                          className="form-control"
                          value={banner.title || ""}
                          onChange={(e) => updateBanner(index, "title", e.target.value)}
                        />
                      </CmsSettingsField>
                      <CmsSettingsField label="Description">
                        <textarea
                          className="form-control"
                          rows={2}
                          value={banner.description || ""}
                          onChange={(e) => updateBanner(index, "description", e.target.value)}
                        />
                      </CmsSettingsField>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm mt-2"
                        onClick={() => handleRemoveBanner(index)}
                      >
                        Remove slide
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CmsSettingsSection>

        <CmsSettingsFooter onSave={handleSave} saveLabel="Save Album">
          <button type="button" className="btn btn-outline-secondary cms-module__toolbar-btn" onClick={() => router.back()}>
            Cancel
          </button>
        </CmsSettingsFooter>
      </CmsSettingsLayout>
    </CmsModuleShell>
  );
}

CreateAlbum.Layout = AdminLayout;
export default CreateAlbum;
