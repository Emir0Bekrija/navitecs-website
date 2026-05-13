"use client";
import { usePageView } from "@/hooks/usePageView";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  Layers,
  Building2,
  Ruler,
  GitMerge,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

import bimConsultingImage from "./images/BIM-CONSULTING-REAL.png";
import revitImage from "./images/Using Revit for structural design.webp";
import bimConsultingchatgptImage from "./images/ChatGPT Image Apr 29, 2026, 09_32_22 AM.png";
import bimConsultingImageRevit from "./images/BIM-CONSULTING.png";

type Service = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  image: string;
  hoverImage: string;
  features: string[];
  capabilities: string[];
};

function ServiceImageBlock({
  service,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  service: Service;
  index: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Transition happens while the element is centered in the viewport
  const mobileProgress = useTransform(
    scrollYProgress,
    [0.3, 0.45, 0.49, 0.55],
    [0, 0.05, 0.3, 1],
  );

  const ind1Width = useTransform(mobileProgress, [0, 1], ["32px", "20px"]);
  const ind2Width = useTransform(mobileProgress, [0, 1], ["20px", "32px"]);
  const ind1Height = useTransform(mobileProgress, [0, 1], ["3px", "2px"]);
  const ind2Height = useTransform(mobileProgress, [0, 1], ["2px", "3px"]);
  const ind1Alpha = useTransform(mobileProgress, [0, 1], [1, 0.3]);
  const ind2Alpha = useTransform(mobileProgress, [0, 1], [0.3, 1]);

  return (
    <div
      className={index % 2 === 1 ? "lg:order-1" : ""}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={ref}
        className="relative rounded-2xl overflow-hidden border border-white/10 w-full h-[500px]"
      >
        <ImageWithFallback
          src={service.image}
          alt={service.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Desktop: clip-path wipe on hover */}
        <ImageWithFallback
          src={service.hoverImage}
          alt={`${service.title} Blueprint`}
          className="absolute inset-0 w-full h-full object-cover z-10 hidden lg:block"
          style={{
            clipPath: isHovered
              ? "inset(0 0% 0 0)"
              : index % 2 === 0
                ? "inset(0 0 0 100%)"
                : "inset(0 100% 0 0)",
            opacity: isHovered ? 1 : 0.7,
            transition:
              "clip-path 700ms ease-in-out, opacity 700ms ease-in-out",
          }}
        />

        {/* Mobile: scroll-driven crossfade */}
        <motion.div
          className="absolute inset-0 z-10 lg:hidden"
          style={{ opacity: mobileProgress }}
        >
          <ImageWithFallback
            src={service.hoverImage}
            alt={`${service.title} Blueprint`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-2 mt-3 justify-center">
        {/* Desktop */}
        <div
          className="hidden lg:block rounded-full"
          style={{
            width: isHovered ? "20px" : "32px",
            height: isHovered ? "2px" : "3px",
            backgroundColor: isHovered
              ? "rgba(255,255,255,0.3)"
              : "rgba(255,255,255,1)",
            transition:
              "width 500ms ease-in-out, height 500ms ease-in-out, background-color 500ms ease-in-out",
          }}
        />
        <div
          className="hidden lg:block rounded-full"
          style={{
            width: isHovered ? "32px" : "20px",
            height: isHovered ? "3px" : "2px",
            backgroundColor: isHovered
              ? "rgba(255,255,255,1)"
              : "rgba(255,255,255,0.3)",
            transition:
              "width 500ms ease-in-out, height 500ms ease-in-out, background-color 500ms ease-in-out",
          }}
        />
        {/* Mobile */}
        <motion.div
          className="lg:hidden rounded-full bg-white"
          style={{ width: ind1Width, height: ind1Height, opacity: ind1Alpha }}
        />
        <motion.div
          className="lg:hidden rounded-full bg-white"
          style={{ width: ind2Width, height: ind2Height, opacity: ind2Alpha }}
        />
      </div>
    </div>
  );
}

export default function ServicesClient() {
  usePageView();
  const services = [
    {
      icon: Layers,
      title: "BIM Consulting",
      description:
        "Comprehensive BIM coordination services to ensure seamless collaboration between all project stakeholders.",
      image: bimConsultingImage.src,
      hoverImage: bimConsultingImageRevit.src,
      features: [
        "Multidisciplinary Coordination",
        "Clash Detection & Resolution",
        "BIM Workflow Optimization",
        "Model Quality Assurance",
        "4D/5D BIM Integration",
        "Standards & Protocols Development",
      ],
      capabilities: [
        "Coordination between architects, structural engineers, and MEP teams",
        "Early identification of design conflicts through advanced clash detection",
        "Implementation of efficient BIM workflows tailored to project needs",
        "Ensuring model accuracy and compliance with industry standards",
      ],
    },
    {
      icon: Building2,
      title: "Project Development",
      description:
        "Full lifecycle project support from initial concept through construction documentation and delivery.",
      image:
        "https://images.unsplash.com/photo-1626385785701-a0d3b879de2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwYnVpbGRpbmclMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NzU0NTg1NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      hoverImage:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      features: [
        "Conceptual Design Support",
        "Technical Documentation",
        "Construction-Ready Models",
        "Quantity Takeoffs",
        "Construction Sequencing",
        "As-Built Documentation",
      ],
      capabilities: [
        "Comprehensive project planning and development oversight",
        "Detailed technical drawings and specifications",
        "Coordinated 3D models ready for construction",
        "Accurate material quantities for cost estimation",
      ],
    },
    {
      icon: Ruler,
      title: "Architectural & Structural Design",
      description:
        "Functional and compliant design solutions for residential and commercial buildings.",
      image:
        "https://images.unsplash.com/photo-1681216868987-b7268753b81c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBidWlsZGluZyUyMGRlc2lnbnxlbnwxfHx8fDE3NzU0NTg1NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      hoverImage:
        "https://blog.novatr.com/hs-fs/hubfs/Using%20Revit%20for%20structural%20design.png?width=1000&height=562&name=Using%20Revit%20for%20structural%20design.png",
      features: [
        "Architectural Design",
        "Structural Engineering",
        "Building Code Compliance",
        "Space Planning",
        "Facade Design",
        "Structural Analysis",
      ],
      capabilities: [
        "Innovative architectural solutions balancing aesthetics and functionality",
        "Structural systems designed for safety and efficiency",
        "Full compliance with local building codes and regulations",
        "Optimized space utilization and circulation planning",
      ],
    },
    {
      icon: GitMerge,
      title: "MEP Design",
      description:
        "Integrated mechanical, electrical, and plumbing system planning focused on efficiency and safety.",
      image:
        "https://www.hok.com/wp-content/uploads/2023/01/bp-high-performance-mep-1900.jpg",
      hoverImage: "https://miro.medium.com/1*i3XmmDqNRVD5U5gB88yuzw.jpeg",
      features: [
        "HVAC System Design",
        "Electrical Distribution",
        "Plumbing Systems",
        "Fire Protection",
        "Energy Efficiency Analysis",
        "System Integration",
      ],
      capabilities: [
        "Comprehensive mechanical systems for optimal climate control",
        "Efficient electrical design meeting all safety requirements",
        "Integrated plumbing solutions for water supply and drainage",
        "Coordinated MEP systems that work seamlessly together",
      ],
    },
  ];

  const process = [
    {
      number: "01",
      title: "Initial Consultation",
      description:
        "Understanding project requirements, scope, and technical constraints.",
      expandedDescription:
        "We start every BIM project by meeting with stakeholders to understand the building's purpose, design intent, and technical constraints. This includes defining the scope of BIM coordination, identifying key disciplines involved, and establishing project timelines.",
    },
    {
      number: "02",
      title: "Analysis & Planning",
      description:
        "Detailed assessment and development of comprehensive project strategy.",
      expandedDescription:
        "Our team develops a detailed BIM Execution Plan (BEP) outlining modeling standards, Level of Development (LOD) requirements, coordination workflows, and deliverable milestones — ensuring all parties are aligned from day one.",
    },
    {
      number: "03",
      title: "Design Development",
      description:
        "Detailed design of all systems with technical documentation.",
      expandedDescription:
        "We create detailed 3D models for all disciplines — architectural, structural, and MEP — complete with technical documentation, system layouts, and specifications ready for coordination.",
    },
    {
      number: "04",
      title: "BIM Coordination",
      description:
        "Creating coordinated 3D models and identifying potential conflicts.",
      expandedDescription:
        "Using multidisciplinary clash detection, we identify and resolve conflicts between architectural, structural, mechanical, electrical, and plumbing systems before they become costly issues on site.",
    },
    {
      number: "05",
      title: "Quality Review",
      description: "Rigorous checking for compliance and constructability.",
      expandedDescription:
        "Every model undergoes rigorous quality assurance — checking for code compliance, constructability, data integrity, and adherence to international BIM standards such as ISO 19650.",
    },
    {
      number: "06",
      title: "Delivery & Support",
      description:
        "Final documentation and ongoing construction phase support.",
      expandedDescription:
        "We deliver construction-ready documentation including coordinated drawings, quantity takeoffs, and 3D models. Our support continues through the construction phase to resolve on-site queries and model updates.",
    },
  ];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredProcess, setHoveredProcess] = useState<number | null>(null);
  const [hasHoveredProcess, setHasHoveredProcess] = useState(false);

  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#00AEEF]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00FF9C]/10 rounded-full blur-3xl" />
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
                Services
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive BIM consulting and engineering solutions for
              building projects of all scales — from Bosnia and Herzegovina to
              clients across Europe and beyond
            </p>
          </motion.div>
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-32">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  {/* IKONICA 
                  <div className="inline-block p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-6">
                    <service.icon className="text-white" size={32} />
                  </div>
                  */}

                  <h2 className="text-4xl font-bold mb-4">{service.title}</h2>
                  <p className="text-gray-400 text-lg mb-8">
                    {service.description}
                  </p>

                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Key Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {service.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start space-x-2"
                        >
                          <CheckCircle
                            className="text-[#00FF9C] flex-shrink-0 mt-0.5"
                            size={18}
                          />
                          <span className="text-gray-400 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Capabilities</h3>
                    <ul className="space-y-2">
                      {service.capabilities.map((capability, idx) => (
                        <li
                          key={idx}
                          className="text-gray-400 text-sm flex items-start"
                        >
                          <span className="text-[#00AEEF] mr-2">•</span>
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:scale-105 transition-transform"
                  >
                    Request Consultation
                    <ArrowRight className="ml-2" size={20} />
                  </Link>
                </div>

                <ServiceImageBlock
                  service={service}
                  index={index}
                  isHovered={hoveredIndex === index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Does a BIM Project{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Look Like?
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From initial consultation to construction support — here&apos;s
              how we deliver BIM projects step by step
            </p>
          </motion.div>

          <div className="process grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {process.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => {
                  if (window.matchMedia("(pointer: fine)").matches) {
                    setHoveredProcess(index);
                    if (!hasHoveredProcess) setHasHoveredProcess(true);
                  }
                }}
                onMouseLeave={() => {
                  if (window.matchMedia("(pointer: fine)").matches)
                    setHoveredProcess(null);
                }}
                onClick={() => {
                  if (!window.matchMedia("(pointer: fine)").matches)
                    setHoveredProcess(
                      hoveredProcess === index ? null : index,
                    );
                }}
                className={`relative bg-black border rounded-2xl p-6 transition-colors cursor-default ${
                  hoveredProcess === index
                    ? "border-[#00AEEF]/70 z-10"
                    : "border-white/10"
                }`}
              >
                <div
                  className={`text-5xl font-bold bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent mb-4 transition-opacity ${
                    hoveredProcess === index ? "opacity-50" : "opacity-30"
                  }`}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
                {index === 0 && !hasHoveredProcess && hoveredProcess !== 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mt-3 flex items-center gap-1.5 text-[#00AEEF] text-xs"
                  >
                    <span>Hover to learn more</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="translate-y-px">
                      <path d="M6 2.5v7M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
                <AnimatePresence>
                  {hoveredProcess === index && (
                    <motion.div
                      initial={{ opacity: 0, y: index >= 3 ? 4 : -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: index >= 3 ? 4 : -4 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`absolute left-0 right-0 bg-black border border-[#00AEEF]/40 rounded-2xl p-6 shadow-lg shadow-black/60 z-20 ${
                        index >= 3
                          ? "bottom-full mb-2"
                          : "top-full mt-2"
                      }`}
                    >
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {step.expandedDescription}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Let&apos;s Discuss Your{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Project
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Contact us to learn how our BIM and engineering expertise can
              optimize your building development process.{" "}
              <Link href="/about" className="text-[#00AEEF] hover:underline">
                Learn about our team
              </Link>
              .
            </p>
            <Link
              href="/contact#conversation"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:scale-105 transition-transform"
            >
              Get in Touch
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
