import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempt to fetch from Palm's transparency API
    const response = await fetch("https://api.palm.network/transparency", {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Palm API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Palm Proxy Error]", err);
    // Return mock data for the demo if API is unreachable
    return NextResponse.json({
      totalSupply: "10000000.00",
      reserveBalance: "10050000.00",
      collateralRatio: "100.5",
      lastUpdated: new Date().toISOString(),
    });
  }
}
