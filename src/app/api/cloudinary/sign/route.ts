import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(request: Request) {
  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({ signature });
}
