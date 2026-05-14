"use client";

import { usePageView } from "@/hooks/usePageView";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Users } from "lucide-react";
import type { TeamMember } from "@/types/index";

type Props = { members: TeamMember[] };

export default function TeamPageClient({ members }: Props) {
  usePageView();

  return (
    <div className="overflow-x-hidden">
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
              Meet Our{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Team
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The people behind NAVITECS — experienced engineers, architects,
              and BIM specialists delivering precision and quality
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {members.length === 0 ? (
            <div className="text-center py-20">
              <Users className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400 text-lg">
                Team information coming soon.
              </p>
            </div>
          ) : (
            <motion.div
              className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="group bg-black/60 border border-white/10 rounded-2xl overflow-hidden hover:bg-black hover:border-[#00AEEF]/50 transition-all"
                >
                  {/* Photo */}
                  <div className="relative aspect-square overflow-hidden bg-white/5">
                    {member.imageUrl ? (
                      <ImageWithFallback
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="text-gray-700" size={64} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-1">
                      {member.name}
                    </h2>
                    <p className="text-[#00AEEF] text-sm font-medium mb-3">
                      {member.role}
                    </p>
                    {member.bio && (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
