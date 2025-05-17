import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.0/dist/ethers.min.js";

const CONTRACT_ADDRESS = " 0x2EA00bE7554d34207b07F3a073d44CD5216C0D2F"; // Replace with your contract address
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

let provider, signer, contract;

// Wallet Connection
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      document.querySelector("button.bg-blue-500").textContent = "Wallet Connected";
      alert(`Connected Wallet: ${accounts[0]}`);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Wallet connection failed. Please try again.");
    }
  } else {
    alert("MetaMask is not installed. Please install it to use this platform.");
  }
}

// Dynamic Stats Update
async function updateTotalDonations() {
  if (!contract) return;

  try {
    const totalDonations = await contract.getTotalDonationsAmount();
    document.querySelector(".grid-cols-1 > .bg-gray-50:nth-child(1) p").textContent = `${ethers.formatEther(totalDonations)} ETH`;
  } catch (err) {
    console.error("Failed to fetch total donations:", err);
  }
}

// Add interactivity for campaigns
document.querySelectorAll(".campaign-card").forEach((card, index) => {
  card.addEventListener("click", () => {
    alert(`Campaign ${index + 1} clicked.`);
    // Add specific campaign logic here if needed
  });
});

// Initialize stats and event listeners on page load
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("button.bg-blue-500").addEventListener("click", connectWallet);
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    updateTotalDonations();
  }
});
