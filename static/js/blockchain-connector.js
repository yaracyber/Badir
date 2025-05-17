/**
 * Badir - Blockchain Connector
 * This file contains the core functionality for interacting with the Ethereum blockchain
 */

// Contract details
const CONTRACT_ADDRESS = "0x2EA00bE7554d34207b07F3a073d44CD5216C0D2F";
const CONTRACT_ABI = [
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
    "name": "highestDonation",
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
    "name": "highestDonor",
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
    "name": "maxDonation",
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
    "name": "minDonation",
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

// Global variables
let provider;
let signer;
let contract;

// Connect to MetaMask wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      // Initialize provider with ethers v6
      provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Get signer and initialize contract
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      return {
        success: true,
        address: accounts[0],
        provider: provider,
        signer: signer,
        contract: contract
      };
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      return {
        success: false,
        error: error.message
      };
    }
  } else {
    return {
      success: false,
      error: "MetaMask not detected. Please install MetaMask browser extension."
    };
  }
}

// Make a donation
async function makeDonation(amount) {
  if (!contract || !signer) {
    throw new Error("Wallet not connected");
  }
  
  try {
    // Convert ETH to Wei (ethers v6 format)
    const amountWei = ethers.parseEther(amount.toString());
    
    // Make the donation
    const tx = await contract.donate({ value: amountWei });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      hash: tx.hash,
      receipt: receipt
    };
  } catch (error) {
    console.error("Error making donation:", error);
    throw error;
  }
}

// Get total donations
async function getTotalDonations() {
  if (!contract) return "0";
  
  try {
    const totalDonations = await contract.getTotalDonationsAmount();
    return ethers.formatEther(totalDonations);
  } catch (error) {
    console.error("Error getting total donations:", error);
    return "0";
  }
}

// Get charity address
async function getCharityAddress() {
  if (!contract) return null;
  
  try {
    return await contract.getAddresses();
  } catch (error) {
    console.error("Error getting charity address:", error);
    return null;
  }
}

// Get highest donation (owner only)
async function getHighestDonation() {
  if (!contract) return { amount: "0", donor: null };
  
  try {
    const [amount, donor] = await contract.getHighestDonation();
    return {
      amount: ethers.formatEther(amount),
      donor: donor
    };
  } catch (error) {
    console.error("Error getting highest donation:", error);
    return { amount: "0", donor: null };
  }
}

// Format address for display
function formatAddress(address) {
  if (!address) return "";
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}