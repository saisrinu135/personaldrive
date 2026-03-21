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

# To run as a true standalone application using the `.next/standalone/server.js` output, 
# we need to ensure the public and static files are inside the standalone directory structure.
RUN cp -r public .next/standalone/ && \
    cp -r .next/static .next/standalone/.next/

# Set production environment variables
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Expose Next.js port
EXPOSE 3000

# Start the optimized standalone Next.js application
CMD ["node", ".next/standalone/server.js"]
