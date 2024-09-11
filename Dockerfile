FROM node:18.16.0-bullseye-slim

RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    webp && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Famous-Tech/FAMOUS-MD.git /FAMOUS-MD 
WORKDIR /FAMOUS-MD
RUN npm install
CMD ["node", "famous.js"]
