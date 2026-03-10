# =============================================================
# ======= (0) install packages in the final build image =======
# =============================================================

# Final image - we build it upfront to cache dependencies
FROM ubuntu:jammy as final-container

# See: https://github.com/opencontainers/image-spec/blob/master/annotations.md
LABEL org.opencontainers.image.title='Storyteller Rust (CPU)'
LABEL org.opencontainers.image.authors='bt@brand.io, echelon@gmail.com'
LABEL org.opencontainers.image.description='All of the binaries from the Rust monorepo (CPU)'
LABEL org.opencontainers.image.documentation='https://github.com/storytold/storyteller-web'
LABEL org.opencontainers.image.source='https://github.com/storytold/storyteller-web'
LABEL org.opencontainers.image.url='https://github.com/storytold/storyteller-web'

WORKDIR /

# Install ffmpeg because rust's (symphonia, mp4 crate, etc.) all fail to decode video metadata
# Install rsync to copy files to other containers
# Install vim for debugging
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
        ffmpeg \
        rsync \
        vim \
        --no-install-recommends \
    && apt-get clean autoclean && apt-get autoremove -y && rm -rf /var/lib/{apt,dpkg,cache,log}/

# ================================================================
# =============== (1) set up core rust build image ===============
# ================================================================

FROM ubuntu:jammy as rust-base

# NB: This can be "stable" or another version.
ARG RUST_TOOLCHAIN="1.93.0"

WORKDIR /tmp

# NB: cmake is required for freetype-sys-0.13.1, which in turn has only been added for egui.
# NB: fontconfig is required by servo-fontconfig-sys, which is in the dependency chain for egui.
# NB: libfontconfig-dev is required by servo-fontconfig-sys, which is in the dependency chain for egui.
# NB: pkg-config and libssl are for container TLS; we may switch to rustls in the future.
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
        build-essential \
        cmake \
        curl \
        ffmpeg \
        fontconfig \
        git \
        libclang-dev \
        libfontconfig1-dev \
        libssl-dev \
        musl-tools \
        perl \
        pkg-config

# NB: Fix for fontconfig (servo-fontconfig-sys): https://github.com/alacritty/alacritty/issues/4423#issuecomment-727277235
# TODO(bt, 2023-02-23): This has not been verified to work yet.
RUN export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh  -s -- --default-toolchain $RUST_TOOLCHAIN -y

# Install correct Rust version
#RUN $HOME/.cargo/bin/rustup install $RUST_VERSION
#RUN $HOME/.cargo/bin/rustup default $RUST_VERSION

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
COPY _database ./_database/
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

# Build all the binaries.
RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin storyteller-web

RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin seedance2-pro-job

RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin worldlabs-job
    
RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin dummy-service

RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin analytics-job

RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin email-sender-job

RUN SQLX_OFFLINE=true \
  LD_LIBRARY_PATH=/usr/lib:${LD_LIBRARY_PATH} \
  $HOME/.cargo/bin/cargo build \
  --release \
  --bin es-update-job

# Print a report on disk space
RUN echo "Disk usage at current directory (after all builds):"
RUN pwd
RUN du -hsc * | sort -hr

# =============================================================
# =============== (4) construct the final image ===============
# =============================================================

# Final image
FROM final-container as final

# # See: https://github.com/opencontainers/image-spec/blob/master/annotations.md
# LABEL org.opencontainers.image.title='Storyteller Rust (CPU)'
# LABEL org.opencontainers.image.authors='bt@brand.io, echelon@gmail.com'
# LABEL org.opencontainers.image.description='All of the binaries from the Rust monorepo (CPU)'
# LABEL org.opencontainers.image.documentation='https://github.com/storytold/storyteller-web'
# LABEL org.opencontainers.image.source='https://github.com/storytold/storyteller-web'
# LABEL org.opencontainers.image.url='https://github.com/storytold/storyteller-web'
#
# WORKDIR /

# # Install rsync to copy files to other containers
# RUN apt-get update \
#     && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
#         rsync \
#         --no-install-recommends \
#     && apt-get clean autoclean && apt-get autoremove -y && rm -rf /var/lib/{apt,dpkg,cache,log}/

# Give the container its version so it can report over HTTP.
ARG GIT_SHA
RUN echo -n ${GIT_SHA} > GIT_SHA

# Copy all the binaries (except those that need a GPU):
COPY --from=builder /tmp/target/release/storyteller-web /
COPY --from=builder /tmp/target/release/seedance2-pro-job /
COPY --from=builder /tmp/target/release/worldlabs-job /
COPY --from=builder /tmp/target/release/dummy-service /
COPY --from=builder /tmp/target/release/analytics-job /
COPY --from=builder /tmp/target/release/email-sender-job  /
COPY --from=builder /tmp/target/release/es-update-job  /

# Legacy apps:
# COPY --from=builder /tmp/target/release/tts-download-job /
# COPY --from=builder /tmp/target/release/tts-inference-job /

# NB(bt,2023-11-28): These still seem essential even after switching to rustls
# NB(bt,2023-11-30): I commented out the /etc/ssl copy and it broke certs, so this is *essential*
# SSL certs are required for crypto
COPY --from=builder /etc/ssl /etc/ssl

# NB(bt,2023-11-28): These still seem essential even after switching to rustls
# Required dynamically linked libraries
COPY --from=builder /usr/lib/x86_64-linux-gnu/libssl.*             /lib/x86_64-linux-gnu/
COPY --from=builder /usr/lib/x86_64-linux-gnu/libcrypto.*          /lib/x86_64-linux-gnu/

# Container includes
COPY includes/ /includes

# Make sure all the links resolve
RUN ldd storyteller-web

# Without a .env file, Rust crashes "mysteriously" (ugh)
RUN touch .env
RUN touch .env-secrets

# Some services have default env files that live under their code directories
# These should also be readable from the relative current path
COPY crates/service/web/storyteller_web/config/storyteller-web.common.env .
COPY crates/service/web/storyteller_web/config/storyteller-web.production.env .

EXPOSE 8080
CMD LD_LIBRARY_PATH=/usr/lib /storyteller-web
