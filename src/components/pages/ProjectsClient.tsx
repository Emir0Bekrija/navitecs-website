"use client";
import { usePageView } from "@/hooks/usePageView";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Filter, ArrowRight, MapPin, Clock } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { projects as staticProjects } from "../../data/projects";
import type { Project } from "@/types/index";

type Props = { initialProjects?: Project[]; comingSoon?: boolean };

const FILTERS = [
  "All",
  "Residential",
  "Commercial",
  "Industrial",
  "Healthcare",
  "Infrastructure",
  "MEP",
];

export default function ProjectsClient({
  initialProjects,
  comingSoon = false,
}: Props) {
  usePageView();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  const projects = initialProjects ?? staticProjects;
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredProjects =
    activeFilter === "All"
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  return (
    <div className="overflow-x-hidden sticky">
      {/* ── Coming Soon overlay ─────────────────────────────────────────────── */}
      {comingSoon && (
        /* Absolute — sits inside the page flow so nav (fixed z-50) and footer
           (outside this component) remain fully accessible.
           The inner sticky div keeps the "Coming Soon" text pinned to the
           viewport as the user scrolls through the blurred content below. */
        <div className="absolute inset-0 z-[45] overflow-hidden">
          {/* Full-height background effects */}
          <div className="absolute inset-0 bg-black/78 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

          {/* Sticky viewport — stays centered while user scrolls */}
          <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient glow orbs (clipped to viewport via the sticky container) */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00AEEF]/12 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00FF9C]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00AEEF]/5 rounded-full blur-[160px] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto select-none">
              {/* Top badge */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 rounded-full border border-[#00AEEF]/30 bg-[#00AEEF]/8 text-[#00AEEF] text-xs font-semibold uppercase tracking-[0.18em]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00AEEF] animate-pulse" />
                Under Construction
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6"
              >
                <span className="text-white">Coming</span>
                <br />
                <span className="bg-gradient-to-r from-[#00AEEF] via-[#00d4ff] to-[#00FF9C] bg-clip-text text-transparent">
                  Soon
                </span>
              </motion.h2>

              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-24 h-px bg-gradient-to-r from-transparent via-[#00AEEF] to-transparent mb-8"
              />

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-400 text-lg sm:text-xl leading-relaxed max-w-xl"
              >
                We&apos;re curating our portfolio of BIM coordination and
                engineering projects.
                <br />
                <span className="text-gray-500 text-base mt-2 block">
                  Check back soon.
                </span>
              </motion.p>

              {/* Decorative dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center gap-2 mt-12"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#00AEEF]/60 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </motion.div>
            </div>

            {/* Bottom brand mark */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs text-gray-600 uppercase tracking-[0.25em] select-none"
            >
              NAVITECS
            </motion.div>
          </div>
        </div>
      )}

      {/* ── Page content (blurred when coming soon) ──────────────────────────── */}
      <div
        className={comingSoon ? "pointer-events-none select-none" : ""}
        style={
          comingSoon ? { filter: "blur(10px)", userSelect: "none" } : undefined
        }
        aria-hidden={comingSoon ? true : undefined}
      >
        {/* Hero */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,174,239,0.1)_0%,transparent_70%)]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.1)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                Our{" "}
                <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                  Projects
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Explore our portfolio of successfully delivered BIM coordination
                and engineering projects
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filter bar */}
        <section className="py-12 sticky top-20 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Filter className="text-gray-400" size={20} />
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-2 rounded-lg font-medium transition-all text-sm ${
                    activeFilter === filter
                      ? "bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  layout
                  className="group relative bg-black border border-white/10 rounded-2xl overflow-hidden hover:border-[#00AEEF]/50 transition-all flex flex-col"
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="absolute inset-0 z-10"
                  >
                    <span className="sr-only">
                      View {project.title} case study
                    </span>
                  </Link>

                  {/* Image */}
                  <div className="relative h-56 overflow-hidden bg-white/5">
                    <ImageWithFallback
                      src={project.featuredImage ?? ""}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* Featured badge */}
                    {project.featured && (
                      <div className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black rounded-md z-10">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#00AEEF] uppercase tracking-wider">
                        {project.category}
                      </span>
                      <Building2 className="text-gray-600" size={16} />
                    </div>

                    <h2 className="text-lg font-semibold mb-2 group-hover:text-[#00AEEF] transition-colors leading-snug">
                      {project.title}
                    </h2>

                    <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Meta row */}
                    {(project.location || project.timeline) && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {project.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} />
                            {project.location}
                          </span>
                        )}
                        {project.timeline && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={11} />
                            {project.timeline}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Scope pills */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                          {project.scopeOfWork.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400 truncate max-w-[120px]"
                            >
                              {s}
                            </span>
                          ))}
                          {project.scopeOfWork.length > 2 && (
                            <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-500">
                              +{project.scopeOfWork.length - 2}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="text-gray-600 group-hover:text-[#00AEEF] transition-colors group-hover:translate-x-1 w-5 h-5 shrink-0" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">
                  No projects found in this category.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      {/* end blurred content wrapper */}
    </div>
  );
}
