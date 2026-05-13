"use client";

import {
  X,
  Monitor,
  Settings,
  Search,
  MousePointer,
  CheckCircle,
} from "lucide-react";

type Props = { onClose: () => void };

const STEPS = [
  {
    icon: Monitor,
    title: "Open Windows Settings",
    description: (
      <>
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs font-mono">
          Win
        </kbd>{" "}
        +{" "}
        <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs font-mono">
          I
        </kbd>{" "}
        on your keyboard, or click the Start menu and select{" "}
        <strong className="text-white">Settings</strong>.
      </>
    ),
  },
  {
    icon: Settings,
    title: "Go to Apps → Default apps",
    description: (
      <>
        In the left sidebar click <strong className="text-white">Apps</strong>,
        then select <strong className="text-white">Default apps</strong> from
        the list.
      </>
    ),
  },
  {
    icon: Search,
    title: "Search for Thunderbird",
    description: (
      <>
        In the search box at the top of the Default apps page, type{" "}
        <strong className="text-white">Thunderbird</strong>. Click the result
        that appears.
      </>
    ),
  },
  {
    icon: MousePointer,
    title: "Set Thunderbird as default for Email",
    description: (
      <>
        Find <strong className="text-white">MAILTO</strong> in the list of file
        types and link types. Click it, select{" "}
        <strong className="text-white">Thunderbird</strong> from the popup, then
        click <strong className="text-white">Set default</strong>.
      </>
    ),
  },
  {
    icon: CheckCircle,
    title: "Done — test it",
    description: (
      <>
        Click any <strong className="text-white">Reply via Email</strong> button
        in the admin panel. Thunderbird should open automatically with the
        recipient pre-filled.
      </>
    ),
  },
];

export default function ThunderbirdSetupModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold text-white">
              Set Thunderbird as Default Mail Client
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Windows 10 / 11</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-4">
              {/* Step number + connector */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00AEEF]/20 to-[#00FF9C]/20 border border-[#00AEEF]/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#00AEEF]">
                    {i + 1}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-px flex-1 bg-white/10 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="pb-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <step.icon size={14} className="text-[#00FF9C] shrink-0" />
                  <h4 className="text-sm font-semibold text-white">
                    {step.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <p className="text-xs text-gray-600">
            Thunderbird must be installed on this computer
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
