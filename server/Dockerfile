FROM node:20

WORKDIR /usr/src/app

# Copy package definition and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY . .

# Expose port (corresponds to PORT in .env)
EXPOSE 5000

CMD ["node", "index.js"]
