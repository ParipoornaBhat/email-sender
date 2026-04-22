"use client";

import { useBannerContext } from "@/contexts/BannerContext";
import { LogIn, LogOut, Moon, Sun, User, Mail, History, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/server/better-auth/client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { toast } from "sonner";

export default function NavBar() {
	const { isBannerVisible, bannerHeight } = useBannerContext();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();
	const { data: session } = authClient.useSession();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsProfileDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
			toast.success("Logged out successfully!");
		} catch (err) {
			console.error("Sign out failed:", err);
			toast.error("Error signing out");
		}
	};

	if (!mounted) return null;

	const navLinks = [
		{ name: "Send Email", href: "/ref-cert-email", icon: Mail },
		{ name: "History", href: "/history", icon: History },
		{ name: "Accounts", href: "/accounts", icon: Settings },
	];

	return (
		<>
			<nav
				className="fixed left-0 right-0 w-full h-20 flex flex-row items-center px-8 justify-between z-50 transition-all duration-300"
				style={{
					top: isBannerVisible ? `${bannerHeight}px` : "0px",
					backgroundColor: "transparent",
				}}
			>
				{/* Glassmorphism Background Container */}
				<div className="absolute inset-x-4 top-2 bottom-2 bg-white/30 dark:bg-zinc-950/30 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 shadow-xl pointer-events-none" />

				<div className="relative flex flex-row gap-4 items-center z-10">
					<Link href="/">
						<div className="relative w-12 h-12 bg-white/40 dark:bg-white/25 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
							<Image
								src="/FLC.jpg"
								alt="FLC Logo"
								fill
								style={{ objectFit: "contain" }}
							/>
						</div>
					</Link>
					<div className="hidden sm:block">
						<h1 className="text-xl font-bold text-zinc-900 dark:text-white drop-shadow-sm">
							Bulk Emailer
						</h1>
						<p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
							by Finite Loop Club
						</p>
					</div>
				</div>

				{/* Desktop Nav */}
				<div className="relative hidden md:flex flex-row items-center gap-2 z-10">
					{navLinks.map((link) => (
						<Link key={link.href} href={link.href}>
							<button className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${pathname === link.href ? "bg-white/50 dark:bg-white/20 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm" : "text-zinc-700 dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-white/10"}`}>
								<link.icon size={18} />
								<span className="font-semibold text-sm">{link.name}</span>
							</button>
						</Link>
					))}
				</div>

				<div className="relative flex flex-row gap-3 items-center z-10">
					<button
						onClick={toggleTheme}
						className="relative bg-white/40 dark:bg-white/15 hover:bg-white/60 dark:hover:bg-white/25 backdrop-blur-2xl rounded-2xl w-12 h-12 flex justify-center items-center shadow-lg transition-all duration-300 active:scale-95"
					>
						{theme === "dark" ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}
					</button>

					{session ? (
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
								className="bg-white/40 dark:bg-white/15 hover:bg-white/60 dark:hover:bg-white/25 backdrop-blur-2xl rounded-2xl px-4 py-2 h-12 flex items-center gap-3 shadow-lg transition-all duration-300 active:scale-95 border border-white/20 dark:border-white/10"
							>
								{session.user.image ? (
									<Image src={session.user.image} alt="User" width={28} height={28} className="rounded-full border border-white/50" />
								) : (
									<User size={20} className="text-zinc-700 dark:text-zinc-300" />
								)}
								<span className="hidden sm:inline font-bold text-sm text-zinc-900 dark:text-white">
									{session.user.name?.split(" ")[0]}
								</span>
							</button>

							{isProfileDropdownOpen && (
								<div className="absolute right-0 top-full mt-3 w-52 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden p-2 animate-in slide-in-from-top-2 duration-200">
									<button
										onClick={handleSignOut}
										className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 font-semibold"
									>
										<LogOut size={18} />
										Logout
									</button>
								</div>
							)}
						</div>
					) : (
						<Link href="/auth/login">
							<button className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-6 h-12 rounded-2xl font-bold shadow-lg shadow-fuchsia-500/20 transition-all duration-300 active:scale-95 flex items-center gap-2">
								<LogIn size={20} />
								Login
							</button>
						</Link>
					)}

					<button
						onClick={toggleMenu}
						className="md:hidden bg-white/40 dark:bg-white/15 rounded-2xl w-12 h-12 flex justify-center items-center shadow-lg active:scale-95"
					>
						{isMenuOpen ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
					</button>
				</div>
			</nav>

			{/* Mobile Menu */}
			{isMenuOpen && (
				<div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-300">
					<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleMenu} />
					<div className="absolute top-24 left-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 border border-white/20 dark:border-white/10 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300">
						{navLinks.map((link) => (
							<Link key={link.href} href={link.href} onClick={toggleMenu}>
								<div className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${pathname === link.href ? "bg-fuchsia-500 text-white" : "bg-white/50 dark:bg-white/10 text-zinc-900 dark:text-white"}`}>
									<link.icon size={22} />
									<span className="font-bold">{link.name}</span>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</>
	);
}
