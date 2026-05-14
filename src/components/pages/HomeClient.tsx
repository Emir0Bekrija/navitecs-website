"use client";
import { usePageView } from "@/hooks/usePageView";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Layers,
  GitMerge,
  CheckCircle,
  Ruler,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import ToolsSection from "../ToolsSection";

export default function HomeClient() {
  usePageView();
  const services = [
    {
      icon: Layers,
      title: "BIM Consulting",
      description:
        "Coordination, clash detection and workflow optimization across all disciplines",
    },
    {
      icon: Building2,
      title: "Project Development",
      description:
        "Full lifecycle support with technical documentation and construction-ready models",
    },
    {
      icon: Ruler,
      title: "Architectural & Structural Design",
      description:
        "Functional, compliant design for residential and commercial buildings",
    },
    {
      icon: GitMerge,
      title: "MEP Design",
      description:
        "Integrated mechanical, electrical and plumbing system planning",
    },
  ];

  const industries = [
    "Architectural Electrical and Construction",
    "Infrastructure and Public Works",
    "Industrial and Process Plants",
    "Specialized Sectors and Services",
  ];

  const stats = [
    { value: "300+", label: "Projects Delivered" },
    { value: "10+", label: "Years Experience" },
    { value: "30+", label: "Active Clients" },
  ];

  const whyBIM = [
    {
      icon: CheckCircle,
      title: "Clash Detection",
      description: "Identify and resolve conflicts before construction begins",
    },
    {
      icon: CheckCircle,
      title: "Cost Efficiency",
      description: "Reduce errors and rework through precise coordination",
    },
    {
      icon: CheckCircle,
      title: "Time Savings",
      description: "Streamline workflows and accelerate project timelines",
    },
    {
      icon: CheckCircle,
      title: "Better Collaboration",
      description:
        "Seamless coordination between architects, engineers, and contractors",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,174,239,0.1)_0%,transparent_70%)]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.1)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Precision in Design.{" "}
                <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                  Excellence
                </span>{" "}
                in Execution.
              </h1>

              <p className="text-xl text-gray-400 mb-8 max-w-xl">
                NAVITECS delivers advanced BIM consulting and engineering
                solutions, ensuring seamless coordination across all stages of
                building development. Based in Sarajevo, Bosnia and
                Herzegovina, we serve clients across Europe and internationally.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/services"
                  className="group relative px-8 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg overflow-hidden transition-all hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Our Services
                    <ArrowRight
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                      size={20}
                    />
                  </span>
                </Link>

                <div className="relative inline-flex bg-black/50 border border-white/15 hover:bg-black hover:border-white/30 rounded-lg shadow-lg">
                  <Link
                    href="/contact"
                    className="relative z-10 inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg  transition-all"
                  >
                    <span>Start a Project</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="text-3xl font-bold bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1618385455730-2571c38966b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCSU0lMjBidWlsZGluZyUyMG1vZGVsJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3NTQ1ODU1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="BIM Building Model"
                  className="absolute inset-0 w-full h-full object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </motion.div>
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
              What is{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                BIM?
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Building Information Modeling (BIM) is a digital representation of
              physical and functional characteristics of a facility. It enables
              multidisciplinary collaboration throughout a building&apos;s
              lifecycle—from initial design to construction and operation.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {whyBIM.map((item) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="relative bg-black/50 border border-white/15 rounded-2xl p-6 hover:bg-black hover:border-white/30 transition-all shadow-lg"
              >
                <div className="mb-4">
                  <item.icon className="text-[#00FF9C]" size={32} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What are BIM Core{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Services?
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Comprehensive BIM and engineering solutions for your building
              projects
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {services.map((service) => (
              <motion.div
                key={service.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative bg-black/50 border border-white/15 rounded-2xl p-8 hover:bg-black hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    <service.icon className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-400">{service.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-flex items-center text-[#00AEEF] hover:text-[#00FF9C] transition-colors font-medium"
            >
              View All Services
              <ArrowRight className="ml-2" size={20} />
            </Link>
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
              Industries{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                We Serve
              </span>
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {industries.map((industry) => (
              <motion.div
                key={industry}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="relative bg-black/50 border border-white/15 rounded-xl p-6 hover:bg-black hover:border-white/30 transition-all text-center shadow-lg"
              >
                <h3 className="font-semibold text-lg">{industry}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <ToolsSection />

      <section className="py-24 relative overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Next Project?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Let&apos;s discuss how our BIM and engineering expertise can bring
              precision and efficiency to your building development.{" "}
              <Link href="/about" className="text-[#00AEEF] hover:underline">
                Learn more about us
              </Link>
              .
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Contact Us
                <ArrowRight
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
