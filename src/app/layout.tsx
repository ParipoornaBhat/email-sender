import "@/styles/globals.css";
import type { Metadata } from "next";
import { Geist, Lilita_One, Comic_Neue } from "next/font/google";
import Background from "@/components/layout/Background";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";
import Toaster from "@/components/ui/Toaster";
import { BannerProvider } from "@/contexts/BannerContext";

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const lilita = Lilita_One({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-lilita",
});

const comic = Comic_Neue({
	weight: ["300", "400", "700"],
	subsets: ["latin"],
	variable: "--font-comic",
});

export const metadata: Metadata = {
	title: {
		default: "Finite Loop Club | Bulk Emailer",
		template: "%s | Finite Loop Club",
	},
	description:
		"Finite loop club encourages students of NMAMIT to realize their idea through competitive programming participation, hands-on experience on real-time projects and by conducting many more coding events that will inspire the next generation of innovators.",
	keywords: [
		"Finite Loop Club",
		"NMAMIT",
		"bulk email",
		"email sender",
		"competitive programming",
		"tech community",
		"innovation",
	],
	authors: [{ name: "Finite Loop Club" }],
	creator: "Finite Loop Club",
	publisher: "Finite Loop Club",
	metadataBase: new URL("https://www.finiteloop.club"),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://www.finiteloop.club",
		title: "Finite Loop Club Bulk Emailer",
		description:
			"Securely send bulk emails with dynamic certificate generation.",
		siteName: "Finite Loop Club",
		images: [
			{
				url: "/FLC.jpg",
				width: 1200,
				height: 630,
				alt: "Finite Loop Club",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Finite Loop Club Bulk Emailer",
		description:
			"Securely send bulk emails with dynamic certificate generation.",
		images: ["/FLC.jpg"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`min-h-screen flex flex-col font-sans selection:bg-fuchsia-500/30 ${geist.variable} ${lilita.variable} ${comic.variable}`}>
				<Providers>
					<BannerProvider>
						<Toaster />
						<Navbar />
						<div className="fixed inset-0 -z-10 pointer-events-none">
							<Background />
						</div>
						<main className="flex-1 pt-30 pb-12">
							{children}
						</main>
						<Footer />
					</BannerProvider>
				</Providers>
			</body>
		</html>
	);
}
