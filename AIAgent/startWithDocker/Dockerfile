FROM node:23.3.0-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    pkg-config \
    python3 \
    make \
    g++ \
    git \
    # canvas 依赖
    libpixman-1-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    build-essential \
    python3-dev \
    librsvg2-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    ln -s /usr/bin/python3 /usr/bin/python

RUN npm install -g pnpm@9.15.3

RUN git clone https://github.com/donut33-social/De-evolution.git && \
    mv De-evolution app && \
    cd app && \
    git checkout main && \
    pnpm install

WORKDIR /app

EXPOSE 3000