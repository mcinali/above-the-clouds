FROM node:14.15.0

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source source code
COPY . .

# Expose ports 8080 & 8000
EXPOSE 8080
EXPOSE 8000

# RUNTIME COMMANDS
CMD ["node","app.js"]
