# Stage 1: Build the app
FROM node:18 AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to install dependencies
COPY package*.json ./

# Install dependencies (use npm ci for faster and more reliable installs if package-lock.json is present)
RUN npm ci

# Rebuild bcrypt for the correct platform inside the container
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the app source code into the container
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: Run the app
FROM node:18-alpine

# Set the working directory for the final container
WORKDIR /usr/src/app

# Install production dependencies (to avoid including dev dependencies)
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/docs ./docs

# Add a non-root user to improve security
RUN addgroup appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port that your NestJS app listens on
EXPOSE 3000

# Set the default command to run the app
CMD ["node", "dist/main"]
