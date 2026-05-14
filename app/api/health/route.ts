export async function GET() {
  return Response.json({
    status: "ok",
    service: "wit-app",
    timestamp: new Date().toISOString(),
  });
}
