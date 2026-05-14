export default function Home() {
  return (
    <main style={{
      display: "flex",
      minHeight: "100vh",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ maxWidth: "32rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "0.75rem" }}>
          Wit
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#6b7280", marginBottom: "1.5rem" }}>
          Meat inventory &amp; lot traceability platform
        </p>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          borderRadius: "9999px",
          background: "#f0fdf4",
          padding: "0.375rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#15803d",
          border: "1px solid #bbf7d0",
        }}>
          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", background: "#22c55e", display: "inline-block" }} />
          Service is running
        </span>
      </div>
    </main>
  );
}
