FROM node:14.15.0

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source source code
COPY . .

# Expose port 8080
EXPOSE 8080

# RUNTIME COMMANDS
CMD ["node","app.js"]
