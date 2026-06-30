import { NextResponse } from "next/server";
import { getStorageBackend, isCloudStorageEnabled } from "@/lib/storage/internalDatabase";

export async function GET() {
  const backend = getStorageBackend();
  return NextResponse.json({
    backend,
    cloud: isCloudStorageEnabled(),
  });
}
