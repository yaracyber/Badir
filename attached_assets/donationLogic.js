import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.0/dist/ethers.min.js";

const CONTRACT_ADDRESS = "0x2EA00bE7554d34207b07F3a073d44CD5216C0D2F"; // Replace with your actual contract address

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

// Connect Wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      alert("Wallet connected: " + accounts[0]);
      document.getElementById("connect-wallet-btn").textContent = "Wallet Connected";
    } catch (err) {
      console.error("Error connecting wallet:", err);
      alert(`Error: ${err.message}`);
    }
  } else {
    alert("MetaMask not detected. Please install MetaMask.");
  }
}

// Donate Function
async function donate() {
  if (!contract || !signer) {
    alert("Please connect your wallet first.");
    return;
  }

  const amount = document.getElementById("donate-amount").value;
  if (!amount || parseFloat(amount) < 0.2 || parseFloat(amount) > 20) {
    alert("Enter a valid donation amount between 0.2 and 20 ETH.");
    return;
  }

  try {
    const tx = await contract.donate({
      value: ethers.parseEther(amount), // Convert ETH to Wei
    });
    await tx.wait();
    alert("Donation successful!");
  } catch (err) {
    console.error("Error making donation:", err);
    alert("Donation failed. Please try again.");
  }
}

// Fetch Highest Donation
async function getHighestDonation() {
  try {
    const [highestDonation, highestDonor] = await contract.getHighestDonation();
    document.getElementById("highest-donation-result").textContent = `
      Highest Donation: ${ethers.formatEther(highestDonation)} ETH
      Donor: ${highestDonor}
    `;
  } catch (err) {
    console.error("Error fetching highest donation:", err);
    alert("Failed to fetch highest donation. Ensure you're the contract owner.");
  }
}

// Fetch Charity Address
async function getCharityAddress() {
  try {
    const charityAddress = await contract.getAddresses();
    document.getElementById("addresses-result").textContent = `Charity Address: ${charityAddress}`;
  } catch (err) {
    console.error("Error fetching charity address:", err);
    alert("Failed to fetch charity address.");
  }
}

// Fetch Total Donations
async function getTotalDonations() {
  try {
    const totalDonations = await contract.getTotalDonationsAmount();
    document.getElementById("total-donations-result").textContent = `Total Donations: ${ethers.formatEther(totalDonations)} ETH`;
  } catch (err) {
    console.error("Error fetching total donations:", err);
    alert("Failed to fetch total donations.");
  }
}

// Event Listeners
document.getElementById("connect-wallet-btn").addEventListener("click", connectWallet);
document.getElementById("donate-btn").addEventListener("click", donate);
document.getElementById("get-highest-donation-btn").addEventListener("click", getHighestDonation);
document.getElementById("get-addresses-btn").addEventListener("click", getCharityAddress);
document.getElementById("get-total-donations-btn").addEventListener("click", getTotalDonations);