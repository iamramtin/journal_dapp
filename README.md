# Anchor Journal

A decentralized journaling application built on Solana using the Anchor framework. It allows users to create, update, and delete journals and their entries, with data stored on-chain.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.18.0 or higher
- **Rust**: v1.77.2 or higher
- **Anchor CLI**: v0.30.1 or higher
- **Solana CLI**: v1.18.17 or higher

### Installation

1. Clone the repository:

   ```shell
   git clone git@github.com:iamramtin/journal-dapp.git
   cd journal-dapp
   ```

2. Install dependencies:

   ```shell
   pnpm install
   ```

3. Start the web app:

   ```shell
   pnpm dev
   ```

## Apps

### Anchor

This is a Solana program written in Rust using the Anchor framework.

#### Commands

1. **Sync the program ID**:  
   Updates the program ID in the configuration and source files.

   ```shell
   pnpm anchor keys sync
   ```

2. **Start the Solana test validator**:  
   Launches a local Solana test validator with the program deployed.

   ```shell
   pnpm anchor::localnet
   ```

3. **Build and deploy the Anchor program**:

   ```shell
   pnpm anchor::build
   pnpm anchor::deploy
   ```

4. **Run the tests**:  
   Executes the test suite for the Anchor program.

   ```shell
   pnpm anchor::test
   ```

5. **Request an airdrop**:  
   Use this script to request an airdrop of SOL to your wallet for testing purposes.

   ```shell
   pnpm airdrop
   ```

### Web

This is a React app that uses the Anchor-generated client to interact with the Solana program.

#### Commands

- **Start the web app**:  
  Launches the development server.

  ```shell
  pnpm dev
  ```

- **Build the web app**:  
  Creates a production build of the web app.

  ```shell
  pnpm build
  ```

- **Run the production server**:  
  Starts the web app in production mode.
  ```shell
  pnpm start
  ```
