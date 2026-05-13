"use client";

import { motion } from "framer-motion";
import { Box, Layers, Settings, Compass, Database, Cloud } from "lucide-react";

export default function ToolsSection() {
  const tools = [
    {
      icon: Box,
      name: "Revit",
      description: "Primary BIM authoring tool",
    },
    {
      icon: Compass,
      name: "AutoCAD",
      description: "2D drafting and documentation",
    },
    {
      icon: Cloud,
      name: "BIM 360 / ACC",
      description: "Cloud collaboration platform",
    },
    {
      icon: Layers,
      name: "Navisworks",
      description: "Model coordination and clash detection",
    },
    {
      icon: Settings,
      name: "Civil 3D",
      description: "Infrastructure design and documentation",
    },
    {
      icon: Database,
      name: "ReCap",
      description: "Reality capture and 3D scanning",
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Our{" "}
            <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
              Tools
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Industry-leading BIM and engineering software for precision and
            efficiency
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-black/50 border border-white/15 rounded-2xl p-6 hover:bg-black hover:border-white/30 transition-all group shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl group-hover:scale-110 transition-transform">
                  <tool.icon className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{tool.name}</h3>
                  <p className="text-gray-400 text-sm">{tool.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
