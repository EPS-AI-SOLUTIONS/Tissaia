# server/Dockerfile
# Multi-stage Rust build for Tissaia v4.0 Web Edition
# Deployed on Fly.io (Frankfurt, fra)

# ============================================
# Stage 1: Build
# ============================================
FROM rust:1.83-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies — copy only manifests first
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src target/release/deps/tissaia*

# Build the actual application
COPY src/ src/
RUN cargo build --release

# ============================================
# Stage 2: Runtime
# ============================================
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/target/release/tissaia-server /app/tissaia-server

# Create non-root user
RUN useradd -m -s /bin/bash appuser
USER appuser

# Fly.io exposes port 8080 by default
ENV PORT=8080
EXPOSE 8080

CMD ["/app/tissaia-server"]
