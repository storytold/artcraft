# ================================================================
# =============== (1) set up core rust build image ===============
# ================================================================

FROM ubuntu:jammy as rust-base

# NB: This can be "stable" or another version.
ARG RUST_TOOLCHAIN="1.78.0"

WORKDIR /tmp

# NB: cmake is required for freetype-sys-0.13.1, which in turn has only been added for egui.
# NB: fontconfig is required by servo-fontconfig-sys, which is in the dependency chain for egui.
# NB: libfontconfig-dev is required by servo-fontconfig-sys, which is in the dependency chain for egui.
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
        build-essential \
        cmake \
        curl \
        fontconfig \
        libfontconfig1-dev \
        pkg-config musl musl-dev musl-tools

# NB: Fix for fontconfig (servo-fontconfig-sys): https://github.com/alacritty/alacritty/issues/4423#issuecomment-727277235
# TODO(bt, 2023-02-23): This has not been verified to work yet.
RUN export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig

ARG RUST_TOOLCHAIN="1.81.0"
# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh  -s -- --default-toolchain $RUST_TOOLCHAIN -y

# Install correct Rust version
#RUN $HOME/.cargo/bin/rustup default stable-x86_64-unknown-linux-gnu

# Report Rust version for build debugging
RUN $HOME/.cargo/bin/rustup show
RUN $HOME/.cargo/bin/rustc --version
RUN $HOME/.cargo/bin/cargo --version

# Cargo Chef does Rust build caching: https://github.com/LukeMathWalker/cargo-chef
# TODO(bt,2023-03-08): builds are failing with "no space left on device"; disabling build caching
#RUN $HOME/.cargo/bin/cargo install cargo-chef --locked

# ======================================================================
# =============== (2) use cargo-chef to "plan" the build ===============
# ======================================================================

FROM rust-base AS planner

# NB: Copying in everything does not appear to impact cached builds if irrelevant files are changed (at least at this step)
# TODO(bt,2023-03-08): builds are failing with "no space left on device"; disabling build caching
#COPY . .
# TODO(bt,2023-03-08): builds are failing with "no space left on device"; disabling build caching
#RUN $HOME/.cargo/bin/cargo chef prepare --recipe-path recipe.json

# ======================================================================================================
# =============== (3) "cook" the libraries (cacheable), then run the app build and tests ===============
# ======================================================================================================

FROM rust-base AS builder

# TODO(bt,2023-03-08): builds are failing with "no space left on device"; disabling build caching
#COPY --from=planner /tmp/recipe.json recipe.json

# NB: This step builds and caches the dependencies as its own layer.
# TODO(bt,2023-03-08): builds are failing with "no space left on device"; disabling build caching
#RUN $HOME/.cargo/bin/cargo chef cook --release --recipe-path recipe.json

# NB: Now we build and test our code.
COPY Cargo.lock .
COPY Cargo.toml .
COPY .sqlx/ .sqlx
COPY _elasticsearch ./_elasticsearch
COPY crates/ ./crates
COPY includes/ ./includes
COPY test_data/ ./test_data

# Print a report on disk space
#RUN echo "Disk usage at root (before tests):"
#RUN du -hsc / | sort -hr
RUN echo "Disk usage at current directory (before tests):"
RUN pwd
RUN du -hsc * | sort -hr

# Run all of the tests
#RUN SQLX_OFFLINE=true \
#  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
#  $HOME/.cargo/bin/cargo test

# Print a report on disk space
#RUN echo "Disk usage at root (after tests):"
#RUN du -hsc / | sort -hr
RUN echo "Disk usage at current directory (after tests):"
RUN pwd
RUN du -hsc * | sort -hr

# Build all the binaries that run on GPU, including "dummy-service".
RUN RUSTFLAGS="-C target-feature=+crt-static" SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release --target=x86_64-unknown-linux-gnu \
  --bin dummy-service

RUN RUSTFLAGS="-C target-feature=+crt-static" SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release --target=x86_64-unknown-linux-gnu \
  --bin download-job

RUN RUSTFLAGS="-C target-feature=+crt-static" SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release --target=x86_64-unknown-linux-gnu \
  --bin inference-job

RUN ls -lR $HOME/.cargo/bin
RUN $HOME/.cargo/bin/rustup target add x86_64-unknown-linux-musl


RUN RUSTFLAGS="-C target-feature=+crt-static" SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release --target=x86_64-unknown-linux-musl \
  --bin inference-job
# Print a report on disk space
RUN echo "Disk usage at current directory (after all builds):"
RUN pwd
RUN du -hsc * | sort -hr

# =============================================================
# =============== (4) construct the final image ===============
# =============================================================

# Final image
#FROM ubuntu:jammy as final
# TODO(bt,2023-04-26): This is only necessary for download-job and inference-job
#FROM nvidia/cuda:12.0.1-runtime-ubuntu22.04 as final # Same image as so-vits-svc
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 as final

# See: https://github.com/opencontainers/image-spec/blob/master/annotations.md
LABEL org.opencontainers.image.title='Storyteller Rust (GPU)'
LABEL org.opencontainers.image.authors='bt@brand.io, echelon@gmail.com'
LABEL org.opencontainers.image.description='All of the binaries from the Rust monorepo (GPU)'
LABEL org.opencontainers.image.documentation='https://github.com/storytold/storyteller-web'
LABEL org.opencontainers.image.source='https://github.com/storytold/storyteller-web'
LABEL org.opencontainers.image.url='https://github.com/storytold/storyteller-web'

WORKDIR /

# Install rsync to copy files to other containers
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
        rsync \
        --no-install-recommends \
    && apt-get clean autoclean && apt-get autoremove -y && rm -rf /var/lib/{apt,dpkg,cache,log}/

# Give the container its version so it can report over HTTP.
ARG GIT_SHA
RUN echo -n ${GIT_SHA} > GIT_SHA

# Copy all the binaries.
COPY --from=builder /tmp/target/x86_64-unknown-linux-gnu/release/dummy-service /
COPY --from=builder /tmp/target/x86_64-unknown-linux-gnu/release/download-job /
COPY --from=builder /tmp/target/x86_64-unknown-linux-gnu/release/inference-job /
COPY --from=builder /tmp/target/x86_64-unknown-linux-musl/release/inference-job /inference-job-musl

# Container includes
COPY includes/ /includes

# Make sure all the links resolve
RUN ldd inference-job

# Without a .env file, Rust crashes "mysteriously" (ugh)
RUN touch .env
RUN touch .env-secrets

# Some services have default env files that live under their code directories
# These should also be readable from the relative current path
COPY crates/service/job/download_job/config/download-job.common.env .
COPY crates/service/job/download_job/config/download-job.production.env .

COPY crates/service/job/inference_job/config/inference-job.common.env .
COPY crates/service/job/inference_job/config/inference-job.production.env .

# # Need python to make use of other containers' venv
# # TODO(bt,2023-04-26): This is only necessary for download-job and inference-job
# # NB(bt,2023-05-04): Installing lsof, htop, ripgrep, as debugging tools
# # - net-tools: netstat, for debugging process network connections
# # - psmisc: fuser, for determining which things users have opennetstat, for debugging process network connections
# # - libnvidia-container: these are installed to attempt to fix https://github.com/NVIDIA/nvidia-docker/issues/1618#issuecomment-1120104007
# RUN apt-get update && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
#     ffmpeg \
#     htop \
#     less \
#     libnvidia-container-dev \
#     libnvidia-container-tools \
#     libnvidia-container1 \
#     libsndfile1 \
#     lsof \
#     net-tools \
#     nvidia-driver-530 \
#     psmisc \
#     python3-pip \
#     python3.10 \
#     python3.10-venv \
#     ripgrep \
#     tmux \
#     vim \
#     --no-install-recommends
#
# # NB(bt,2023-11-17): We need python3.8 for vall-e-x (for now)
# # We should make the effort to get it running on python3.10
# RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install software-properties-common -y \
#     && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC add-apt-repository ppa:deadsnakes/ppa -y \
#     && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get update \
#     && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y python3.8 python3.8-venv python3.8-dev python3.8-full python3.8-distutils

RUN  apt-get clean autoclean && apt-get autoremove -y && rm -rf /var/lib/{apt,dpkg,cache,log}/

# NB(bt,2023-05-28): Python logging may be slowing down in k8s
# See: https://github.com/kubernetes-client/python/issues/1867
COPY includes/container_includes/python_overrides/logger/__init__.py /usr/lib/python3.10/logging/__init__.py
# COPY includes/container_includes/python_overrides/logger/__init__.py /usr/lib/python3.8/logging/__init__.py

EXPOSE 8080
