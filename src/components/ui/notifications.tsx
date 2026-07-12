"use client";

import { cn } from "@/lib/utils/utils";
import { AlertCircle, Clock, FilePlus, Globe, HandCoins, Mail, Package, Sparkles } from "lucide-react";
import { AnimatedList } from "./animated-list";

let notifications = [
  {
    name: "Payment received",
    description: "KES 45,000 from Acme Studio",
    time: "2m ago",
    icon: HandCoins,
    color: "#00C9A7",
  },
  {
    name: "New order placed",
    description: "Website package • Starter plan",
    time: "6m ago",
    icon: Package,
    color: "#FFB800",
  },
  {
    name: "Client message",
    description: "Sarah sent a message about project updates",
    time: "9m ago",
    icon: Mail,
    color: "#FF3D71",
  },
  {
    name: "Invoice overdue",
    description: "Invoice #INV-1023 is 3 days late",
    time: "18m ago",
    icon: AlertCircle,
    color: "#FF6B6B",
  },
  {
    name: "Website published",
    description: "Landing page is now live",
    time: "32m ago",
    icon: Globe,
    color: "#1E86FF",
  },
  {
    name: "AI follow-up sent",
    description: "Lenzro AI emailed 3 inactive leads",
    time: "1h ago",
    icon: Sparkles,
    color: "#8B5CF6",
  },
  {
    name: "File uploaded",
    description: "Brand assets added to Drive",
    time: "2h ago",
    icon: FilePlus,
    color: "#22C55E",
  },
  {
    name: "Meeting scheduled",
    description: "Client call tomorrow at 10:00 AM",
    time: "3h ago",
    icon: Clock,
    color: "#0EA5E9",
  },
];


notifications = Array.from({ length: 10 }, () => notifications).flat();

const Notification = ({ name, description, icon: Icon, color, time }) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          {/* Render the Lucide icon component */}
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function AnimatedListDemo({ className }) {
  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full flex-col overflow-hidden p-2",
        className,
      )}
    >
      <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t"></div>
    </div>
  );
}
