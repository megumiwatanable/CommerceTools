import { NextResponse } from "next/server";

export async function DELETE() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.delete("commerce_flash");
  return response;
}
