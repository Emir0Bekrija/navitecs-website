"use client";
import { usePageView } from "@/hooks/usePageView";

import { motion } from "motion/react";
import { useState } from "react";
import { Mail, MapPin, Send, CheckCircle } from "lucide-react";

const PROJECT_SERVICES = [
  "Structural Analysis",
  "Thermal Analysis",
  "Seismic Analysis",
  "Retrofitting",
  "Custom Solutions",
];

export default function Contact() {
  usePageView();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationBanner, setValidationBanner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    projectType: "",
    message: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);

  function toggleService(s: string) {
    setSelectedServices((prev) => {
      const next = prev.includes(s)
        ? prev.filter((x) => x !== s)
        : [...prev, s];
      if (next.length > 0) setErrors((e) => ({ ...e, services: "" }));
      return next;
    });
  }

  function validateField(name: string, value: string): string {
    switch (name) {
      case "name":
        return value.trim() ? "" : "Name is required.";
      case "email":
        if (!value.trim()) return "Email is required.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Please enter a valid email address.";
      case "company":
        return value.trim() ? "" : "Company is required.";
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        return /^\+?[\d\s\-(). ]{7,20}$/.test(value.trim())
          ? ""
          : "Please enter a valid phone number.";
      case "projectType":
        return value ? "" : "Please select a project type.";
      case "message":
        return value.trim() ? "" : "Project details are required.";
      default:
        return "";
    }
  }

  function handleBlur(
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg }));
  }

  const cardClass =
    "rounded-2xl border border-white/30 bg-black/70 p-6 transition-all duration-300 hover:bg-black hover:border-[#00AEEF]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = [
      "name",
      "email",
      "company",
      "phone",
      "projectType",
      "message",
    ] as const;
    const newErrors: Record<string, string> = {};
    for (const field of requiredFields) {
      const msg = validateField(field, formData[field]);
      if (msg) newErrors[field] = msg;
    }
    if (selectedServices.length === 0) {
      newErrors.services = "Please select at least one service.";
    }
    if (!consent) {
      newErrors.consent =
        "You must consent to data processing before submitting.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setValidationBanner(true);
      document
        .getElementById("conversation")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setValidationBanner(false);
    setSubmitError(null);
    setSubmitting(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        projectServices: selectedServices.join(","),
        consentDataProcessing: consent,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitError(
        typeof json.error === "string"
          ? json.error
          : "Something went wrong. Please try again.",
      );
      document
        .getElementById("conversation")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setFormSubmitted(true);
    document
      .getElementById("conversation")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        projectType: "",
        message: "",
      });
      setSelectedServices([]);
      setConsent(false);
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name])
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "info@navitecs.com",
      link: "mailto:info@navitecs.com",
    },
    {
      icon: MapPin,
      title: "Office",
      content: "Džemala Bijedića 131, Sarajevo 71000, Bosnia and Herzegovina",
      link: "https://maps.app.goo.gl/dZbE2A3oHuww2jiC8",
      external: true,
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,174,239,0.1)_0%,transparent_70%)]"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.1)_0%,transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Get in{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Contact us to discuss your BIM coordination and engineering needs
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((info, index) => (
              <motion.a
                key={info.title}
                href={info.link}
                target={info.external ? "_blank" : undefined}
                rel={info.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${cardClass} group`}
              >
                <div className="inline-block p-3 bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <info.icon className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                <p className="text-gray-400">{info.content}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-black/70 hover:bg-black">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${cardClass} text-center`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your{" "}
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent">
                Project?
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Whether you need BIM coordination, structural engineering, MEP
              design, or complete project development services, our team is
              ready to help. Contact us today to discuss your requirements.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="conversation" className="relative bg-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">Start a Conversation</h2>
              <p className="text-gray-400 mb-8">
                Fill out the form below and we'll respond within 24 hours
              </p>

              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-[#00AEEF]/10 to-[#00FF9C]/10 border border-[#00FF9C]/50 rounded-2xl p-8 text-center"
                >
                  <div className="inline-block p-4 bg-[#00FF9C]/20 rounded-full mb-4">
                    <CheckCircle className="text-[#00FF9C]" size={48} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Message Sent</h3>
                  <p className="text-gray-400">
                    Thank you for contacting us. We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-black/70 hover:bg-black border rounded-lg focus:outline-none transition-colors text-white ${errors.name ? "border-red-500/70 focus:border-red-500" : "border-white/30 focus:border-[#00AEEF]"}`}
                        placeholder="Your name"
                      />
                      {errors.name && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-black/70 hover:bg-black border rounded-lg focus:outline-none transition-colors text-white ${errors.email ? "border-red-500/70 focus:border-red-500" : "border-white/30 focus:border-[#00AEEF]"}`}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium mb-2"
                      >
                        Company *
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-black/70 hover:bg-black border rounded-lg focus:outline-none transition-colors text-white ${errors.company ? "border-red-500/70 focus:border-red-500" : "border-white/30 focus:border-[#00AEEF]"}`}
                        placeholder="Company name"
                      />
                      {errors.company && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {errors.company}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium mb-2"
                      >
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-black/70 hover:bg-black border rounded-lg focus:outline-none transition-colors text-white ${errors.phone ? "border-red-500/70 focus:border-red-500" : "border-white/30 focus:border-[#00AEEF]"}`}
                        placeholder="+387 XX XXX XXX"
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-xs text-red-400">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="projectType"
                      className="block text-sm font-medium mb-2"
                    >
                      Project Type *
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-black/70 hover:bg-black border rounded-lg focus:outline-none transition-colors text-white ${errors.projectType ? "border-red-500/70 focus:border-red-500" : "border-white/30 focus:border-[#00AEEF]"}`}
                    >
                      <option value="" className="bg-[#111] text-white">
                        Select project type
                      </option>
                      <option
                        value="residential"
                        className="bg-[#111] text-white"
                      >
                        Residential
                      </option>
                      <option
                        value="commercial"
                        className="bg-[#111] text-white"
                      >
                        Commercial
                      </option>
                      <option
                        value="infrastructure"
                        className="bg-[#111] text-white"
                      >
                        Infrastructure
                      </option>
                      <option
                        value="bim-consulting"
                        className="bg-[#111] text-white"
                      >
                        BIM Consulting
                      </option>
                      <option
                        value="mep-design"
                        className="bg-[#111] text-white"
                      >
                        MEP Design
                      </option>
                      <option value="other" className="bg-[#111] text-white">
                        Other
                      </option>
                    </select>
                    {errors.projectType && (
                      <p className="mt-1.5 text-xs text-red-400">
                        {errors.projectType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Services Required *
                    </label>
                    <div
                      className={`flex flex-wrap gap-2 p-3 rounded-lg border transition-colors ${errors.services ? "border-red-500/50" : "border-transparent"}`}
                    >
                      {PROJECT_SERVICES.map((s) => {
                        const active = selectedServices.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleService(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              active
                                ? "bg-[#00AEEF]/15 border-[#00AEEF]/50 text-[#00AEEF]"
                                : "bg-black/70 border-white/20 text-gray-400 hover:border-white/40 hover:text-white"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    {errors.services && (
                      <p className="mt-1.5 text-xs text-red-400">
                        {errors.services}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                    >
                      Project Details *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={6}
                      className={`w-full px-4 py-3 bg-black/70 hover:bg-black border rounded-lg focus:outline-none transition-colors text-white resize-none ${errors.message ? "border-red-500/70 focus:border-red-500" : "border-white/30 focus:border-[#00AEEF]"}`}
                      placeholder="Tell us about your project requirements..."
                    />
                    {errors.message && (
                      <p className="mt-1.5 text-xs text-red-400">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Legal consent */}
                  <div className="space-y-1 p-5 bg-black/70 border border-white/20 rounded-xl">
                    <p className="text-sm font-medium text-gray-200 mb-3">
                      Legal consent *
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          if (e.target.checked)
                            setErrors((prev) => ({ ...prev, consent: "" }));
                        }}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-[#00FF9C] cursor-pointer"
                      />
                      <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">
                        I consent to NAVITECS collecting and processing my
                        personal data (name, email, company, phone number,
                        project type, selected services, and project details)
                        for the purpose of responding to my inquiry, in
                        accordance with the{" "}
                        <a
                          href="/privacy-policy"
                          className="underline underline-offset-2 hover:text-white transition-colors"
                        >
                          Privacy Policy
                        </a>
                        . My data will not be retained for longer than 12
                        months.
                      </span>
                    </label>
                    {errors.consent && (
                      <p className="ml-7 text-xs text-red-400">
                        {errors.consent}
                      </p>
                    )}
                  </div>

                  {validationBanner && (
                    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                      Please fill in all required fields before submitting.
                    </p>
                  )}

                  {submitError && (
                    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span>{submitting ? "Sending..." : "Send Message"}</span>
                    <Send size={20} />
                  </button>
                </form>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold mb-6">Office Location</h3>
                <div className={cardClass}>
                  <h4 className="font-semibold text-lg mb-4">
                    NAVITECS d.o.o.
                  </h4>
                  <div className="space-y-3 text-white">
                    <div className="flex items-start space-x-3">
                      <MapPin
                        className="text-[#00AEEF] flex-shrink-0 mt-1"
                        size={20}
                      />
                      <div>
                        <p>Džemala Bijedića 131</p>
                        <p>Sarajevo</p>
                        <p>Bosnia and Herzegovina</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail
                        className="text-[#00AEEF] flex-shrink-0 mt-1"
                        size={20}
                      />
                      <p>info@navitecs.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden h-80 rounded-2xl border border-white/30">
                <iframe
                  src="https://maps.google.com/maps?q=43.85046,18.36181&z=16&output=embed"
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    filter: "invert(90%) hue-rotate(180deg)",
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="NAVITECS Office Location"
                />
                <a
                  href="https://maps.app.goo.gl/dZbE2A3oHuww2jiC8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                >
                  <MapPin size={11} className="text-[#00AEEF]" />
                  Open in Maps
                </a>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6">Business Hours</h3>
                <div className={`${cardClass} space-y-3`}>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monday - Friday</span>
                    <span className="font-medium">08:00 - 16:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Saturday - Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
