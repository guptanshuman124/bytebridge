# ByteBridge

ByteBridge is a peer-to-peer file transfer application built using React, TypeScript, and Vite on the frontend, and Node.js with Socket.IO on the backend. It allows users to share files directly from their browser without relying on a central server for file storage.

## Features

- Peer-to-peer file transfer using WebRTC (via PeerJS).
- Real-time communication with Socket.IO.
- Simple and intuitive user interface.
- No file size restrictions (limited only by browser and network capabilities).

## Project Structure

```
backend/
  server.ts          # Backend server using Express and Socket.IO
  package.json       # Backend dependencies and scripts
  tsconfig.json      # TypeScript configuration for the backend

frontend/
  src/
    App.tsx          # Main React component for the application
    main.tsx         # Entry point for the React app
    index.css        # Global styles
  public/
    vite.svg         # Favicon
  package.json       # Frontend dependencies and scripts
  tsconfig.json      # TypeScript configuration for the frontend
  vite.config.ts     # Vite configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/bytebridge.git
   cd bytebridge
   ```

2. Install dependencies for both the backend and frontend:

   ```sh
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:

   ```sh
   cd backend
   npm run start
   ```

   The backend server will run on `http://localhost:3000`.

2. Start the frontend development server:

   ```sh
   cd frontend
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`.

### Building for Production

To build the frontend for production:

```sh
cd frontend
npm run build
```

The production-ready files will be available in the `frontend/dist` directory.

### Linting

To lint the frontend code:

```sh
cd frontend
npm run lint
```

## Usage

1. Open the application in your browser at `http://localhost:5173`.
2. Upload a file to generate a shareable link.
3. Share the link with the receiver.
4. The receiver can use the link to download the file directly.

## Technologies Used

### Frontend

- React
- TypeScript
- Vite
- PeerJS
- Socket.IO Client

### Backend

- Node.js
- Express
- Socket.IO

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
