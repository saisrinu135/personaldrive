# Frontend Dockerfile - Single Stage Standalone
FROM node:22-alpine

WORKDIR /app

# Install native dependencies if needed
RUN apk add --no-cache libc6-compat

# Install node dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all application files
COPY . .

# Build the application
RUN npm run build

# To run as a true standalone application, the server.js file expects
# the public and .next/static folders to be locally available inside its directory.
RUN test -d public && mkdir -p .next/standalone/public && cp -a public/. .next/standalone/public/ || true
RUN test -d .next/static && mkdir -p .next/standalone/.next/static && cp -a .next/static/. .next/standalone/.next/static/ || true

# Set production environment variables
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Expose Next.js port
EXPOSE 3000

# Change working directory so server.js inherently finds its static files
WORKDIR /app/.next/standalone

# Start the optimized standalone Next.js application
CMD ["node", "server.js"]
