"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePageView } from "@/hooks/usePageView";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Maximize2,
  Minimize2,
  Users,
  Building2,
  Wrench,
  Star,
  Lightbulb,
  Puzzle,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Project } from "@/types/index";
import type { ContentBlock } from "@/lib/blocks";

type Props = { project: Project };

// ── Lightbox ──────────────────────────────────────────────────────────────────

type LightboxImage = { src: string; caption?: string };
type LightboxState = { images: LightboxImage[]; index: number };
type OpenLightbox = (images: LightboxImage[], index?: number) => void;

const ZOOM_STEP = 0.25;
const ZOOM_MIN  = 1;

// Largest size that fits inside availW × availH while keeping aspect ratio (object-contain logic)
function computeFit(nw: number, nh: number, availW: number, availH: number) {
  if (nw / nh > availW / availH) {
    return { w: availW, h: Math.round(availW * nh / nw) };
  }
  return { w: Math.round(availH * nw / nh), h: availH };
}

function LightboxModal({
  state,
  onClose,
}: {
  state: LightboxState;
  onClose: () => void;
}) {
  const [index, setIndex]     = useState(state.index);
  const [scale, setScale]     = useState(1);
  const [zoomMax, setZoomMax] = useState(5);
  const [fitSize, setFitSize] = useState<{ w: number; h: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const count   = state.images.length;
  const current = state.images[index];

  // Available area for the image itself — full screen minus the controls strip at bottom
  const CTRL_H  = 52; // px reserved for zoom controls + caption
  const availW  = () => window.innerWidth;
  const availH  = () => window.innerHeight - CTRL_H;

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const fit = computeFit(img.naturalWidth, img.naturalHeight, availW(), availH());
    setFitSize(fit);
    // Max zoom: whichever axis fills the full screen first
    const maxToFillScreen = Math.max(availW() / fit.w, availH() / fit.h);
    setZoomMax(Math.max(Math.ceil(maxToFillScreen / ZOOM_STEP) * ZOOM_STEP, 2));
  }

  function resetImage() { setFitSize(null); setScale(1); }

  const prev    = useCallback(() => { setIndex((i) => Math.max(0, i - 1));            resetImage(); }, []);
  const next    = useCallback(() => { setIndex((i) => Math.min(count - 1, i + 1));    resetImage(); }, [count]);
  const zoomIn  = useCallback(() => setScale((s) => Math.min(zoomMax,  +(s + ZOOM_STEP).toFixed(2))), [zoomMax]);
  const zoomOut = useCallback(() => setScale((s) => Math.max(ZOOM_MIN, +(s - ZOOM_STEP).toFixed(2))), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")             onClose();
      if (e.key === "ArrowLeft")          prev();
      if (e.key === "ArrowRight")         next();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-")                  zoomOut();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, zoomIn, zoomOut]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const displayW = fitSize ? Math.round(fitSize.w * scale) : undefined;
  const displayH = fitSize ? Math.round(fitSize.h * scale) : undefined;

  // After each zoom, re-center the scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop  = (el.scrollHeight - el.clientHeight) / 2;
  }, [displayW, displayH]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
      >
        <X size={22} />
      </button>

      {/* Prev */}
      {count > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-20"
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Scrollable image viewport — fills all space above the controls bar */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner div expands to the image size when zoomed, giving the scroll container real content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth:  "100%",
            minHeight: "100%",
            width:     displayW,
            height:    displayH,
          }}
        >
          <img
            key={current.src}
            src={current.src}
            alt={current.caption ?? ""}
            onLoad={handleLoad}
            draggable={false}
            style={{
              width:     displayW,
              height:    displayH,
              // Before natural dims are known, let CSS constrain it naturally
              maxWidth:  fitSize ? undefined : "100vw",
              maxHeight: fitSize ? undefined : `calc(100vh - ${CTRL_H}px)`,
              objectFit: fitSize ? undefined : "contain",
              transition: "width 0.15s ease, height 0.15s ease",
              flexShrink: 0,
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Controls bar — pinned to bottom */}
      <div
        className="flex items-center justify-center gap-3 py-3 border-t border-white/5"
        style={{ height: CTRL_H }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          disabled={scale <= ZOOM_MIN}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30"
          title="Zoom out (−)"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-xs text-gray-400 w-12 text-center tabular-nums select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= zoomMax}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30"
          title="Zoom in (+)"
        >
          <ZoomIn size={18} />
        </button>
        {current.caption && (
          <span className="text-sm text-gray-500 ml-4">{current.caption}</span>
        )}
        {count > 1 && (
          <span className="text-xs text-gray-600 ml-2 tabular-nums select-none">{index + 1} / {count}</span>
        )}
      </div>

      {/* Next */}
      {count > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-20"
          disabled={index === count - 1}
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}

// ── Fixed Project Overview (always shown in main content) ─────────────────────

function ProjectOverviewSection({ project }: { project: Project }) {
  const meta = [
    { icon: MapPin, label: "Location", value: project.location },
    { icon: Clock, label: "Timeline", value: project.timeline },
    { icon: Maximize2, label: "Project Size", value: project.projectSize },
    { icon: Users, label: "Client Type", value: project.clientType },
    { icon: Building2, label: "Units", value: project.numberOfUnits },
  ].filter((m) => m.value);

  const hasOverview =
    meta.length > 0 ||
    project.scopeOfWork.length > 0 ||
    project.toolsAndTech.length > 0;

  if (!hasOverview) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
        <span
          className="w-1.5 h-6 rounded-full shrink-0"
          style={{ background: "linear-gradient(to bottom, #00AEEF, #00FF9C)" }}
        />
        Project Overview
      </h2>

      {/* Meta grid */}
      {meta.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 pb-8 border-b border-white/10">
          {meta.map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
              </p>
              <p className="text-sm text-white flex items-center gap-1.5 font-medium">
                <Icon size={13} className="text-[#00AEEF] shrink-0" />
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div
        className={`grid gap-8 ${project.scopeOfWork.length > 0 && project.toolsAndTech.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Scope of Work */}
        {project.scopeOfWork.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Scope of Work
            </p>
            <ul className="space-y-2">
              {project.scopeOfWork.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2.5 text-sm text-gray-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00AEEF] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tools & Technologies */}
        {project.toolsAndTech.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Wrench size={11} className="text-[#00FF9C]" />
              Tools & Technologies
            </p>
            <div className="flex flex-wrap gap-2">
              {project.toolsAndTech.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-gray-200 hover:border-[#00FF9C]/30 transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Section header helper ─────────────────────────────────────────────────────

function SectionHeading({
  children,
  color = "#00AEEF",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
      <span
        className="w-1.5 h-6 rounded-full shrink-0"
        style={{ background: `linear-gradient(to bottom, ${color}, #00FF9C)` }}
      />
      {children}
    </h2>
  );
}

// ── Gallery slideshow ─────────────────────────────────────────────────────────

const MAX_INDICATORS = 9;

function GallerySlideshow({
  images,
  openLightbox,
}: {
  images: { url: string; caption?: string }[];
  openLightbox: OpenLightbox;
}) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const dotsStart = Math.max(
    0,
    Math.min(current - Math.floor(MAX_INDICATORS / 2), count - MAX_INDICATORS),
  );
  const visibleCount = Math.min(MAX_INDICATORS, count);

  const lbImages = images.map((img) => ({
    src: img.url,
    caption: img.caption,
  }));

  return (
    <div className="space-y-4">
      {/* Image */}
      <div
        className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[4/3] flex items-center justify-center"
        onClick={() => openLightbox(lbImages, current)}
      >
        <ImageWithFallback
          src={images[current].url}
          alt={images[current].caption ?? `Image ${current + 1}`}
          className="w-full h-full object-contain transition-[filter] duration-200 group-hover:brightness-75"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="px-4 py-2 bg-gray-800/80 rounded-lg text-sm text-gray-100 font-medium">Open image</span>
        </div>
        {count > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent((c) => Math.max(0, c - 1));
              }}
              disabled={current === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 backdrop-blur-sm text-white disabled:opacity-20 hover:bg-black/80 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent((c) => Math.min(count - 1, c + 1));
              }}
              disabled={current === count - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 backdrop-blur-sm text-white disabled:opacity-20 hover:bg-black/80 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Caption */}
      {images[current].caption && (
        <p className="text-center text-sm text-gray-500">
          {images[current].caption}
        </p>
      )}

      {/* Indicator lines */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: visibleCount }, (_, i) => {
            const realIdx = dotsStart + i;
            const isActive = realIdx === current;
            return (
              <button
                key={realIdx}
                onClick={() => setCurrent(realIdx)}
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-6 h-1.5 bg-white"
                    : "w-4 h-1 bg-white/25 hover:bg-white/50"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── BIM embed with fullscreen ─────────────────────────────────────────────────

function BimEmbed({ url, title, height }: { url: string; title: string; height: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-black group"
    >
      <iframe
        src={url}
        style={{ height: isFullscreen ? "100vh" : height }}
        className="w-full border-0 block"
        title={title}
        allowFullScreen
      />
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5
                   rounded-lg bg-black/60 border border-white/15 text-white text-xs
                   opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity
                   backdrop-blur-sm hover:bg-black/80"
      >
        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        {isFullscreen ? "Exit" : "Fullscreen"}
      </button>
    </div>
  );
}

// ── Block renderers ───────────────────────────────────────────────────────────

function BlockRenderer({
  block,
  project,
  openLightbox,
}: {
  block: ContentBlock;
  project: Project;
  openLightbox: OpenLightbox;
}) {
  const d = block.data;

  switch (block.type) {
    case "text":
      return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
            {String(d.content ?? "")}
          </p>
        </div>
      );

    case "image": {
      const url = String(d.url ?? "");
      if (!url) return null;
      return (
        <figure className="space-y-3">
          <div
            className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[4/3] flex items-center justify-center"
            onClick={() =>
              openLightbox([
                {
                  src: url,
                  caption: d.caption ? String(d.caption) : undefined,
                },
              ])
            }
          >
            <ImageWithFallback
              src={url}
              alt={String(d.alt ?? d.caption ?? "Project image")}
              className="w-full h-full object-contain transition-[filter] duration-200 group-hover:brightness-75"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span className="px-4 py-2 bg-gray-800/80 rounded-lg text-sm text-gray-100 font-medium">Open image</span>
            </div>
          </div>
          {!!d.caption && (
            <figcaption className="text-center text-sm text-gray-500">
              {String(d.caption)}
            </figcaption>
          )}
        </figure>
      );
    }

    case "gallery": {
      const images = (d.images as { url: string; caption?: string }[]) ?? [];
      if (!images.length) return null;
      return <GallerySlideshow images={images} openLightbox={openLightbox} />;
    }

    case "challenge": {
      if (!project.challenge) return null;
      return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <SectionHeading>
            <Puzzle size={20} className="text-[#00AEEF]" />
            The Challenge
          </SectionHeading>
          <p className="text-gray-300 text-lg leading-relaxed">
            {project.challenge}
          </p>
        </div>
      );
    }

    case "solution": {
      if (!project.solution) return null;
      return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <SectionHeading>
            <Lightbulb size={20} className="text-[#00FF9C]" />
            The Solution
          </SectionHeading>
          <p className="text-gray-300 text-lg leading-relaxed">
            {project.solution}
          </p>
        </div>
      );
    }

    case "results": {
      if (!project.results.length) return null;
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionHeading color="#00FF9C">Impact & Results</SectionHeading>
          <div className="relative grid gap-4 sm:grid-cols-2">
            {project.results.map((r, i) => (
              <div
                key={i}
                className="bg-white/5 border-2 border-white/10 hover:border-[#00FF9C] hover:bg-[#00FF9C]/5 transition-colors duration-300 p-5 rounded-xl flex items-start gap-3"
              >
                <CheckCircle2 className="text-[#00FF9C] w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-gray-200">{r}</p>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    case "value-delivered": {
      const items =
        ((d.items as string[])?.length
          ? (d.items as string[])
          : project.valueDelivered) ?? [];
      if (!items.length) return null;
      return (
        <div>
          <SectionHeading color="#00AEEF">Value Delivered</SectionHeading>
          <div className="relative grid gap-4 sm:grid-cols-2">
            {items.map((v, i) => (
              <div
                key={i}
                className="bg-[#00AEEF]/5 border-2 border-[#00AEEF]/15 hover:border-[#00AEEF] hover:bg-[#00AEEF]/10 transition-colors duration-300 p-5 rounded-xl flex items-start gap-3"
              >
                <Star className="text-[#00AEEF] w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-gray-200">{v}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "bim-embed": {
      const url = String(d.url ?? "");
      if (!url) return null;
      return (
        <div className="space-y-3">
          {!!d.title && (
            <h3 className="text-lg font-semibold text-white">
              {String(d.title)}
            </h3>
          )}
          <BimEmbed
            url={url}
            title={String(d.title ?? "BIM Model")}
            height={Number(d.height) || 500}
          />
        </div>
      );
    }

    case "video": {
      const url = String(d.url ?? "");
      if (!url) return null;
      const ytMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      );
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      return (
        <div className="space-y-3">
          {!!d.title && (
            <h3 className="text-lg font-semibold text-white">
              {String(d.title)}
            </h3>
          )}
          <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
            {ytMatch ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                className="w-full h-full border-0"
                allowFullScreen
                title={String(d.title ?? "Video")}
              />
            ) : vimeoMatch ? (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                className="w-full h-full border-0"
                allowFullScreen
                title={String(d.title ?? "Video")}
              />
            ) : (
              <video
                src={url}
                poster={String(d.poster ?? "")}
                controls
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      );
    }

    case "before-after": {
      const before = String(d.beforeUrl ?? "");
      const after = String(d.afterUrl ?? "");
      if (!before && !after) return null;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {before && (
              <figure className="space-y-2">
                <div
                  className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/3] bg-black flex items-center justify-center"
                  onClick={() =>
                    openLightbox(
                      [{ src: before }, ...(after ? [{ src: after }] : [])],
                      0,
                    )
                  }
                >
                  <ImageWithFallback
                    src={before}
                    alt="Before"
                    className="w-full h-full object-contain transition-[filter] duration-200 group-hover:brightness-75"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <span className="px-4 py-2 bg-gray-800/80 rounded-lg text-sm text-gray-100 font-medium">Open image</span>
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-gray-400">
                  {String(d.beforeLabel ?? "Before")}
                </p>
              </figure>
            )}
            {after && (
              <figure className="space-y-2">
                <div
                  className="relative group rounded-xl overflow-hidden border border-[#00FF9C]/20 aspect-[4/3] bg-black flex items-center justify-center"
                  onClick={() =>
                    openLightbox(
                      [...(before ? [{ src: before }] : []), { src: after }],
                      before ? 1 : 0,
                    )
                  }
                >
                  <ImageWithFallback
                    src={after}
                    alt="After"
                    className="w-full h-full object-contain transition-[filter] duration-200 group-hover:brightness-75"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <span className="px-4 py-2 bg-gray-800/80 rounded-lg text-sm text-gray-100 font-medium">Open image</span>
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-[#00FF9C]">
                  {String(d.afterLabel ?? "After")}
                </p>
              </figure>
            )}
          </div>
        </div>
      );
    }

    case "cta":
      return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            {String(d.heading ?? "Ready to start your project?")}
          </h3>
          {!!d.subtext && (
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              {String(d.subtext)}
            </p>
          )}
          {!!d.buttonText && !!d.buttonHref && (
            <Link
              href={String(d.buttonHref)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              {String(d.buttonText)}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectDetailsClient({ project }: Props) {
  usePageView();

  const sortedBlocks = [...project.contentBlocks].sort(
    (a, b) => a.order - b.order,
  );

  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const openLightbox: OpenLightbox = useCallback((images, index = 0) => {
    setLightbox({ images, index });
  }, []);

  return (
    <div className="overflow-x-hidden pb-24">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20 justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00AEEF]/10 rounded-full blur-[100px] opacity-60 mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00FF9C]/10 rounded-full blur-[100px] opacity-60 mix-blend-screen pointer-events-none" />
          <div className="absolute inset-0 bg-black/50 z-10" />
          <ImageWithFallback
            src={project.featuredImage ?? ""}
            alt={project.title}
            className="w-full h-full object-cover absolute inset-0"
          />
        </div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              href="/projects"
              className="inline-flex items-center text-gray-300 hover:text-white mb-6 group transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black rounded-lg">
                {project.category}
              </span>
              {project.location && (
                <span className="flex items-center gap-1 text-sm text-gray-300">
                  <MapPin size={13} /> {project.location}
                </span>
              )}
              {project.timeline && (
                <span className="flex items-center gap-1 text-sm text-gray-300">
                  <Clock size={13} /> {project.timeline}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-5 text-white max-w-4xl leading-tight">
              {project.title}
            </h1>

            <p className="text-xl text-gray-200 max-w-3xl">
              {project.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 -mt-10 relative z-30">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-10">
          {/* Fixed overview — always shown */}
          <ProjectOverviewSection project={project} />

          {/* All blocks (challenge/solution/results are fixed order items within) */}
          {sortedBlocks.map((block) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <BlockRenderer
                block={block}
                project={project}
                openLightbox={openLightbox}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <LightboxModal state={lightbox} onClose={() => setLightbox(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA footer */}
      <section className="py-24 mt-12 bg-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to start your next{" "}
            <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
              project?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Partner with us to bring your vision to life through innovative BIM
            coordination and engineering solutions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(0,174,239,0.3)] transition-all hover:-translate-y-1"
          >
            Contact Us
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
