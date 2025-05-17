/**
 * Badir Donation Contract Configuration
 * This file contains the contract ABI and addresses configuration
 */

// Contract ABI (Application Binary Interface)
const donationContractABI = [
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "charityAddress_",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "funder",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "DonationEvent",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "MAX_DONATION",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MIN_DONATION",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "donate",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAddresses",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getHighestDonation",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalDonationsAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "numberOfFunders",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "charityAddrs",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalDonationsAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Contract configuration
const contractConfig = {
    // For local Ganache development (default)
    development: {
        contractAddress: "", // You'll need to deploy your contract on Ganache and update this address
        networkId: 1337,                                               // Default Ganache network ID
        networkName: "Ganache Local",
        rpcUrl: "http://127.0.0.1:7545"                                // Default Ganache RPC URL
    },
    // For Sepolia testnet
    sepolia: {
        contractAddress: "", // You'll need to deploy your contract on Sepolia and update this address
        networkId: 11155111,
        networkName: "Sepolia",
        rpcUrl: "https://rpc.sepolia.org"
    }
};

// Instructions for deploying the contract on Ganache:
/*
1. Open Ganache and make sure it's running
2. Connect MetaMask to Ganache (Network ID: 1337, RPC URL: http://127.0.0.1:7545)
3. Using Remix IDE (https://remix.ethereum.org):
   - Create a new file named Donation.sol
   - Copy your contract code into the file
   - Compile the contract
   - Go to the "Deploy & Run Transactions" tab
   - Select "Injected Web3" as environment (connects to MetaMask)
   - Enter a charity address parameter (use one of your Ganache accounts)
   - Deploy the contract
4. Copy the deployed contract address here
*/

// Set current environment
const currentEnv = "development"; // Change to "sepolia" for testnet
const currentConfig = contractConfig[currentEnv];