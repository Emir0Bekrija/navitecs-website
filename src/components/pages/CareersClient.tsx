"use client";
import { usePageView } from "@/hooks/usePageView";

import { motion } from "framer-motion";
import Link from "next/link";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Briefcase,
  MapPin,
  Clock,
  Heart,
  Users,
  Zap,
  GraduationCap,
  TrendingUp,
  Coffee,
  Globe,
  Award,
  Rocket,
  ArrowRight,
} from "lucide-react";

import type { Job } from "@/types/index";

type CareersClientProps = {
  initialJobs?: Job[];
  generalJobId?: string | null;
};

export default function CareersClient({
  initialJobs = [],
  generalJobId,
}: CareersClientProps) {
  usePageView();
  const jobs = initialJobs;

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Comprehensive health insurance, dental, vision, and wellness programs",
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Work when you're most productive with flexible scheduling",
    },
    {
      icon: Globe,
      title: "Remote Work",
      description: "Work from anywhere with our remote-first culture",
    },
    {
      icon: GraduationCap,
      title: "Learning Budget",
      description:
        "Annual budget for courses, conferences, and professional development",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description:
        "Clear career paths with mentorship and advancement opportunities",
    },
    {
      icon: Coffee,
      title: "Unlimited PTO",
      description:
        "Take time off when you need it with our unlimited vacation policy",
    },
    {
      icon: Users,
      title: "Team Events",
      description:
        "Regular team building activities, offsites, and social events",
    },
    {
      icon: Award,
      title: "Equity Options",
      description: "Share in our success with competitive equity compensation",
    },
  ];

  const values = [
    {
      icon: Rocket,
      title: "Innovation",
      description: "We encourage bold ideas and creative problem-solving",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We work together to achieve extraordinary results",
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description:
        "We invest in our team's continuous learning and development",
    },
    {
      icon: Zap,
      title: "Excellence",
      description: "We strive for the highest quality in everything we do",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1703355685639-d558d1b0f63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBvZmZpY2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzU0NTczMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF]/20 to-[#00FF9C]/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Join Our{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Team
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Build the future of technology with passionate innovators.
              We&apos;re looking for talented individuals who want to make an
              impact.
            </p>
            <a
              href="#positions"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:scale-105 transition-transform"
            >
              View Open Positions
              <ArrowRight className="ml-2" size={20} />
            </a>
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
              Our{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Culture
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We&apos;ve built a culture that values innovation, collaboration,
              and personal growth
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="relative bg-black/50 border border-white/15 rounded-2xl p-6 hover:bg-black hover:border-white/30 transition-all text-center"
              >
                <div className="inline-block p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-4">
                  <value.icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/*
      <section className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Benefits &{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Perks
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We take care of our team so they can do their best work
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-black/50 border border-white/15 rounded-2xl p-6 hover:bg-black hover:border-white/30 transition-all text-center"
              >
                <div className="inline-block p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-4">
                  <benefit.icon className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {[
              "https://images.unsplash.com/photo-1758518729685-f88df7890776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NzU0MTE3NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRldmVsb3BtZW50JTIwdGVhbXxlbnwxfHx8fDE3NzU0NTczMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              "https://images.unsplash.com/photo-1703355685639-d558d1b0f63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBvZmZpY2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzU0NTczMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            ].map((image) => (
              <motion.div
                key={image}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
                className="relative rounded-2xl overflow-hidden group aspect-square"
              >
                <ImageWithFallback
                  src={image}
                  alt="NAVITECS engineering team"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="positions" className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Open{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Positions
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Find your next opportunity and join our growing team
            </p>
          </motion.div>

          <motion.div
            className="space-y-4 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {jobs.map((job) => (
              <motion.div
                key={job.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="relative bg-black/50 border border-white/15 rounded-2xl p-6 hover:bg-black hover:border-white/30 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-[#00AEEF] transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {job.summary || job.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Briefcase size={16} />
                        <span>{job.department}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={16} />
                        <span>{job.type}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/careers/apply?role=${encodeURIComponent(job.title)}&jobId=${encodeURIComponent(job.id)}`}
                    className="px-6 py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2 whitespace-nowrap"
                  >
                    <span>Apply Now</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
              Don&apos;t See Your{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Role?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              We&apos;re always looking for talented individuals. Send us your
              resume and let&apos;s talk about future opportunities.
            </p>
            <div className="relative inline-flex bg-black/50 border border-white/15 hover:border-white/30 hover:bg-black rounded-lg shadow-lg">
              <Link
                href={`/careers/apply?role=General+Application${generalJobId ? `&jobId=${encodeURIComponent(generalJobId)}` : ""}`}
                className="relative z-10 inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg transition-all"
              >
                <span>Get in Touch</span>
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
