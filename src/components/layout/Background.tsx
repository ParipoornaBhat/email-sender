"use client";

import React from "react";

export default function Background() {
	return (
		<div className="fixed inset-0 -z-10 overflow-hidden bg-flc-purple-dark">
			{/* Main Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-flc-purple-dark via-flc-purple-light to-[#2a0e5c]" />
			
			{/* Animated Glows */}
			<div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-flc-orange/10 blur-[120px] animate-pulse" />
			<div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse duration-[10s]" />
			
			{/* Subtle Mesh Pattern */}
			<div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
				style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v2H20v-2h16zm0-8v2H20v-2h16zm-16-8v2h16v-2H20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
			/>
		</div>
	);
}
