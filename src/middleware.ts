import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
	// Determine the base URL for internal fetches
	// Use BETTER_AUTH_URL if available, otherwise fallback to the request origin
	const baseUrl = process.env.BETTER_AUTH_URL || request.nextUrl.origin;
	
	try {
		const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
		});
		
		if (!sessionResponse.ok) {
			return NextResponse.redirect(new URL("/signin", request.url));
		}

		const session = await sessionResponse.json();

		if (!session) {
			return NextResponse.redirect(new URL("/signin", request.url));
		}
	} catch (error) {
		console.error("Middleware Auth Error:", error);
		return NextResponse.redirect(new URL("/signin", request.url));
	}
	
	return NextResponse.next();
}

export const config = {
	matcher: ["/bulk-sender/:path*", "/history/:path*", "/accounts/:path*"],
};
