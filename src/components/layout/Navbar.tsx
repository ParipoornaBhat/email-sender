"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, History, Settings, User, LogOut, Shield, Zap } from "lucide-react";
import { authClient } from "@/server/better-auth/client";
import { toast } from "sonner";
import Image from "next/image";

export default function Navbar() {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);
	const { data: session } = authClient.useSession();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const navLinks = [
		{ name: "Bulk Email", href: "/bulk-sender", icon: Mail },
		{ name: "Campaigns", href: "/history", icon: History },
		{ name: "Accounts", href: "/accounts", icon: Settings },
	];

	return (
		<nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
			<div className="glass-card px-8 py-4 flex items-center justify-between !rounded-full shadow-flc-orange/5 border-white/5">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-3 group">
					<div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all duration-500 overflow-hidden">
						<Image src="/FLC.jpg" alt="FLC Logo" width={44} height={44} className="rounded-xl" />
					</div>
					<div className="flex flex-col -space-y-1">
						<span className="text-xl font-black lilita-font tracking-wider text-white">
							FLC <span className="text-flc-orange">MAIL</span>
						</span>
						<span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Bulk Dispatcher</span>
					</div>
				</Link>

				{/* Nav Links - Only if logged in */}
				<div className="flex items-center gap-1">
					{session && navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
								pathname === link.href
									? "bg-flc-orange text-white shadow-xl shadow-flc-orange/20 scale-105"
									: "text-zinc-400 hover:text-white hover:bg-white/5"
							}`}
						>
							<link.icon size={16} />
							<span className="hidden md:block">{link.name}</span>
						</Link>
					))}
				</div>

				{/* User Profile / Auth */}
				<div className="flex items-center gap-4 border-l border-white/10 pl-4">
					{session ? (
						<div className="flex items-center gap-4">
							<div className="flex flex-col items-end hidden sm:block">
								<p className="text-[11px] font-black text-white truncate max-w-[120px] uppercase tracking-wider">
									{session.user.name}
								</p>
								<button
									onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => {
										toast.success("Signed out");
										window.location.href = "/";
									} } })}
									className="text-[9px] font-black text-zinc-500 hover:text-flc-orange uppercase tracking-widest transition-colors flex items-center gap-1"
								>
									<LogOut size={10} />
									Sign Out
								</button>
							</div>
							<div className="w-11 h-11 rounded-2xl border-2 border-white/5 overflow-hidden bg-white/5 p-1">
								{session.user.image ? (
									<Image src={session.user.image} alt="User" width={40} height={40} className="rounded-xl" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-flc-orange">
										<User size={22} />
									</div>
								)}
							</div>
						</div>
					) : (
						<Link href="/signin" className="group relative px-8 py-3 rounded-2xl bg-white text-zinc-900 font-black uppercase text-xs tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95">
							<span className="relative z-10">Sign In</span>
							<div className="absolute inset-0 bg-flc-orange opacity-0 group-hover:opacity-10 transition-opacity" />
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
}
