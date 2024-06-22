# StreamMate

This project enables you to initiate a video chat with a friend in one click, including screen sharing capabilities. Built with cutting-edge technologies, StreamMate leverages WebRTC for real-time communication, Socket.IO for efficient signaling, and a modern frontend stack for a seamless user experience.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- **One-Click Video Chat**: Start a video call with a friend with a single click.
- **Screen Sharing**: Share your screen during the video call for enhanced collaboration.
- **Perfect Negotiation**: Ensures seamless WebRTC connections.
- **Real-time Communication**: Utilizes Socket.IO for efficient signaling and real-time updates.

## Tech Stack

- **Frontend**:
  - [Next.js](https://nextjs.org/)
  - [Typescript](https://www.typescriptlang.org/)
  - [ShadcnUi](https://shadcn-ui.com/)
  - [TailwindCSS](https://tailwindcss.com/)
- **Backend**:
  - [Node.js](https://nodejs.org/)
  - [Socket.IO](https://socket.io/)

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/installation)

### Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/senbo1/StreamMate.git
    cd StreamMate
    ```

2. **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application

1. **Start the Signaling Server**:
    ```bash
    cd server
    node index.js
    ```

2. **Start the Next.js Application**:
    ```bash
    cd ..
    cn web 
    npm run dev
    # or
    pnpm  dev
    ```

3. **Open your browser** and navigate to `http://localhost:3000`.


## Usage

1. **Open the Application**: Visit the application URL in your browser.
2. **Start a Video Chat**: Click the button to start a video chat. Share the generated link with your friend.
3. **Screen Sharing**: Use the screen sharing option during the call to share your screen.

### Note

The signaling server is deployed on a free instance on [Render](https://render.com/). This instance will spin down with inactivity, which can delay requests by up to 50 seconds when it starts up again.

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.

---
