"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/components/LOGO.png";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Projects", path: "/projects" },
    { name: "Careers", path: "/careers" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" aria-label="NAVITECS Home" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <Image
                src={logo}
                alt="NAVITECS Logo"
                className="relative z-10 h-10 w-50 object-contain"
                loading="eager"
                priority
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="relative px-2 lg:px-4 py-2 text-sm lg:text-lg font-medium transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF] focus-visible:rounded-lg"
              >
                <span
                  className={`relative z-10 ${
                    isActive(link.path)
                      ? "text-white"
                      : link.name === "Careers"
                        ? "nav-careers-shimmer"
                        : "text-gray-400 group-hover:text-white"
                  }`}
                >
                  {link.name}
                </span>
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Link
              href="/contact#conversation"
              className="relative px-4 lg:px-6 py-2.5 text-sm lg:text-base bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg overflow-hidden group"
            >
              <span className="relative z-10">Get in Touch</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-black overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <Link
                href="/contact#conversation"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-4 py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg text-center"
              >
                Get in Touch
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
