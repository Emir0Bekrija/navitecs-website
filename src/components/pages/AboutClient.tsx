"use client";
import { usePageView } from "@/hooks/usePageView";

import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Layers,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import Link from "next/link";
import type { Variants } from "framer-motion";
import type { AboutTeamFeature } from "@/types/index";

type Props = { aboutFeature?: AboutTeamFeature | null };

export default function AboutClient({ aboutFeature }: Props) {
  usePageView();
  const milestones = [
    {
      year: "2019",
      title: "The Beginning",
      description:
        "Initial ideas and early project work took shape, laying the foundation for the company.",
    },
    {
      year: "2020",
      title: "First Projects Delivered",
      description:
        "Completed early projects, gained hands-on experience, and refined the approach.",
    },
    {
      year: "2021",
      title: "Growth & Development",
      description:
        "Expanded capabilities and continued building a portfolio across multiple projects.",
    },
    {
      year: "2022",
      title: "Strengthening Expertise",
      description:
        "Deepened industry knowledge and established consistent workflows and client collaboration practices.",
    },
    {
      year: "2025",
      title: "Official Company Launch",
      description:
        "Founded under the current name, bringing years of experience together into a formal business.",
    },
    {
      year: "2026",
      title: "Looking Ahead",
      description:
        "Focused on growth, innovation, and delivering high-quality solutions to a broader client base.",
    },
    {
      year: "2027",
      title: "Scaling Operations",
      description:
        "Planning to expand the team and take on larger, more complex projects.",
    },
    {
      year: "2028",
      title: "Market Expansion",
      description:
        "Aiming to enter new markets and build long-term partnerships.",
    },
    {
      year: "2029",
      title: "Innovation & New Services",
      description:
        "Exploring new technologies and expanding service offerings.",
    },
    {
      year: "2030",
      title: "Established Industry Presence",
      description:
        "Working toward becoming a recognized and trusted name in the field.",
    },
  ];

  const expertise = [
    {
      icon: Layers,
      title: "BIM Expertise",
      description:
        "Advanced knowledge in Building Information Modeling methodologies and coordination",
    },
    {
      icon: Users,
      title: "Multidisciplinary Team",
      description: "Engineers and architects working in seamless collaboration",
    },
    {
      icon: Award,
      title: "Quality Standards",
      description:
        "Commitment to precision and compliance with international standards",
    },
    {
      icon: CheckCircle,
      title: "Proven Track Record",
      description:
        "300+ successfully delivered projects across various sectors",
    },
  ];

  const values = [
    {
      title: "Precision",
      description:
        "Meticulous attention to detail in every aspect of design and coordination",
    },
    {
      title: "Coordination",
      description:
        "Seamless integration of all building disciplines for clash-free execution",
    },
    {
      title: "Innovation",
      description:
        "Leveraging latest BIM technologies and methodologies for optimal results",
    },
    {
      title: "Reliability",
      description:
        "Consistent delivery of high-quality technical documentation on schedule",
    },
  ];

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 26, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 420,
        damping: 22,
        mass: 0.7,
      },
    },
    hover: {
      y: -16,
      scale: 1.02,
      rotateX: 1,
      transition: {
        type: "spring",
        stiffness: 420,
        damping: 20,
        mass: 0.45,
        velocity: 2,
      },
    },
  };

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
              About{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                NAVITECS
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              A multidisciplinary engineering and architecture consulting firm
              based in Sarajevo, specializing in BIM coordination and technical
              design solutions.
            </p>
          </motion.div>
        </div>
      </section>

      <section>
        <div className="pb-20 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Who We Are
              </h2>
              <p className="text-gray-400 text-lg mb-6">
                NAVITECS d.o.o. is a BIM-focused engineering and architecture
                consulting company based in Sarajevo. Our team of experienced
                engineers and architects delivers comprehensive solutions for
                building design, coordination, and technical systems.
              </p>
              <p className="text-gray-400 text-lg mb-6">
                We specialize in multidisciplinary coordination, working closely
                with structural engineers, MEP specialists, and architects to
                ensure seamless project execution from concept to construction.
              </p>
              <p className="text-gray-400 text-lg">
                With over 10 years of experience and 300+ completed projects, we
                have established ourselves as a trusted partner for complex
                building developments across residential, commercial, and
                infrastructure sectors.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1641060272821-df59e2c0b5ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmFsJTIwb2ZmaWNlJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3NTQ1ODU1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="NAVITECS office"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 bg-black/10">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true, amount: 0.3 }}
              className="relative rounded-2xl border border-white/50 p-8 shadow-lg overflow-hidden bg-black/20 hover:bg-black/90"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20" />
              <div className="relative z-10">
                <div className="inline-block p-4 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-6">
                  <Target className="text-[#00AEEF]" size={32} />
                </div>
                <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
                <p className="text-gray-400 text-lg">
                  To deliver precision-engineered BIM solutions that solve
                  complex coordination challenges in building development. We
                  ensure seamless collaboration between all disciplines,
                  reducing conflicts and optimizing construction processes.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true, amount: 0.3 }}
              className="relative rounded-2xl border border-white/50 p-8 shadow-lg overflow-hidden bg-black/20 hover:bg-black/90"
            >
              <div className="absolute inset-0 bg-linear-to-br from-[#00FF9C]/20 to-[#00AEEF]/20" />
              <div className="relative z-10">
                <div className="inline-block p-4 bg-linear-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-6">
                  <Eye className="text-[#00FF9C]" size={32} />
                </div>
                <h3 className="text-3xl font-bold mb-4">Our Approach</h3>
                <p className="text-gray-400 text-lg">
                  We combine technical expertise with advanced BIM methodologies
                  to deliver coordinated, construction-ready documentation. Our
                  multidisciplinary approach ensures all building systems work
                  together efficiently and comply with all relevant standards.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team preview */}
      {aboutFeature && (
        <section className="py-24 bg-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {aboutFeature.imageUrl && (
                  <ImageWithFallback
                    src={aboutFeature.imageUrl}
                    alt={aboutFeature.title}
                    className="w-full h-auto object-cover"
                  />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  {aboutFeature.title.includes(" ") ? (
                    <>
                      {aboutFeature.title.split(" ").slice(0, -1).join(" ")}{" "}
                      <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                        {aboutFeature.title.split(" ").slice(-1)[0]}
                      </span>
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                      {aboutFeature.title}
                    </span>
                  )}
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-line">
                  {aboutFeature.text}
                </p>
                <div className="mt-8">
                  <Link
                    href="/team"
                    className="inline-flex items-center text-[#00AEEF] hover:text-[#00FF9C] transition-colors font-medium"
                  >
                    Meet the full team
                    <ArrowRight className="ml-2" size={20} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

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
                Journey
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Key milestones in our development as a leading BIM consultancy
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-[#00AEEF] to-[#00FF9C] hidden lg:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}
                >
                  <div
                    className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}
                  >
                    <div className="bg-white/10 border border-white/10 rounded-xl p-6 hover:bg-black/60 hover:border-white/30 duration-300 ease-in-out">
                      <div className="text-2xl font-bold bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-400 hover:black">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden lg:flex w-12 h-12 bg-gradient-to-br from-[#00AEEF] to-[#00FF9C] rounded-full items-center justify-center flex-shrink-0 relative z-10">
                    <div className="w-6 h-6 bg-black rounded-full" />
                  </div>

                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
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
              Our{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Expertise
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              What sets us apart in BIM consulting and engineering
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {expertise.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-white/10 border border-white/15 rounded-xl p-6 hover:bg-black/85 hover:border-white/30 duration-400 ease-in-out shadow-lg"
              >
                <div className="inline-block p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-4">
                  <item.icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
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
              Core{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Values
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The principles guiding our work and client relationships
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-white/10 border border-white/15 rounded-xl p-6 hover:bg-black/85 hover:border-white/30 duration-400 ease-in-out transition-all text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-[#00AEEF] to-[#00FF9C] rounded-full" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
