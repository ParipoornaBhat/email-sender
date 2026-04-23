import Image from "next/image";
import Link from "next/link";
import {
	AiOutlineFacebook,
	AiOutlineGithub,
	AiOutlineInstagram,
	AiOutlineLinkedin,
	AiOutlineMail,
	AiOutlinePhone,
} from "react-icons/ai";

export const social = [
	{
		link: "https://www.instagram.com/finiteloop.club/",
		icon: <AiOutlineInstagram className="h-7 w-7 transition-transform hover:-translate-y-1" />,
		name: "Instagram",
	},
	{
		link: "https://github.com/Finite-Loop-Club-NMAMIT",
		icon: <AiOutlineGithub className="h-7 w-7 transition-transform hover:-translate-y-1" />,
		name: "Github",
	},
	{
		link: "https://www.linkedin.com/company/finite-loop-club/",
		icon: <AiOutlineLinkedin className="h-7 w-7 transition-transform hover:-translate-y-1" />,
		name: "LinkedIn",
	},
	{
		link: "mailto:finiteloopclub@nmamit.in",
		icon: <AiOutlineMail className="h-7 w-7 transition-transform hover:-translate-y-1" />,
		name: "E-mail",
	},
];

export const links = [
	{ name: "Home", link: "/" },
	{ name: "History", link: "/history" },
	{ name: "Accounts", link: "/accounts" },
];

export default function Footer() {
	return (
		<footer className="relative mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
			<div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
					<div className="flex flex-col items-center md:items-start">
						<div className="relative size-16 mb-4">
							<Image
								src="/FLC.jpg"
								alt="FLC Logo"
								className="rounded-2xl object-cover"
								fill
							/>
						</div>
						<p className="font-bold text-xl mb-2">Finite Loop Club</p>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm">
							NMAM Institute of Technology, Nitte
						</p>
					</div>

					<div className="flex flex-col md:items-end">
						<ul className="mb-6 flex flex-wrap justify-center gap-6">
							{links.map((link) => (
								<li key={link.name}>
									<Link href={link.link} className="hover:text-fuchsia-500 transition-colors">
										{link.name}
									</Link>
								</li>
							))}
						</ul>

						<ul className="flex justify-center gap-6">
							{social.map((link) => (
								<li key={link.name}>
									<Link href={link.link} target="_blank" className="text-zinc-600 dark:text-zinc-400 hover:text-fuchsia-500 transition-colors">
										{link.icon}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
					<p>© {new Date().getFullYear()} Finite Loop Club. Made with ❤️ by Finite Loop Club.</p>
					<div className="flex gap-6">
						<Link href="/privacy" className="hover:underline">Privacy</Link>
						<Link href="/terms" className="hover:underline">Terms</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
