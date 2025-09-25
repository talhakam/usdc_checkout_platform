"use client";

import React from "react";
import { User } from "lucide-react";

export default function ClientUserIcon(props: React.SVGProps<SVGSVGElement>) {
  return <User className="w-4 h-4 text-gray-700" {...props} />;
}
