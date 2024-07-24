FROM rust:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
        mariadb-client \
        imagemagick  \
        python3-pip \
        libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

RUN cd /tmp && \
    wget -O entr.zip https://github.com/eradman/entr/archive/refs/tags/5.6.zip && \
    unzip entr.zip && \
    cd entr-5.6 && \
    ./configure && \
    make test && \
    make install \
    && rm -rf /tmp/entr-5.6



RUN cargo install diesel_cli --features mysql && \
  cargo install sqlx-cli --features mysql

WORKDIR /storyteller-rust

ARG GIT_SHA

RUN echo -n ${GIT_SHA} > /GIT_SHA

CMD ["/storyteller-rust/_develop/localdev/startup.sh"]

