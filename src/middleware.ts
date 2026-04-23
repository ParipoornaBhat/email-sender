import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
	// Standard fetch to the session endpoint
	const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
		headers: {
			cookie: request.headers.get("cookie") || "",
		},
	});
	
	const session = await sessionResponse.json();

	if (!session) {
		return NextResponse.redirect(new URL("/signin", request.url));
	}
	
	return NextResponse.next();
}

export const config = {
	matcher: ["/bulk-sender/:path*", "/history/:path*", "/accounts/:path*"],
};
