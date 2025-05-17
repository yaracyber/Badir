/**
 * Badir - Smart Contract Interface
 * 
 * This file contains contract-specific helper functions and constants
 * for interacting with the Ethereum blockchain
 */

// Default fundraising goal in ETH
const DEFAULT_GOAL_ETH = 10;

// Contract addresses (these would be configured properly in production)
// Replace with actual contract address when deployed
const CONTRACT_ADDRESS = '0x123456789abcdef123456789abcdef123456789a';

// Minimal contract ABI for donation functionality
const CONTRACT_ABI = [
    // Read functions
    "function getHighestDonation() view returns (address donor, uint256 amount)",
    "function getTotalDonations() view returns (uint256)",
    "function getCharityAddress() view returns (address)",
    "function getFundraisingGoal() view returns (uint256)",
    "function owner() view returns (address)",
    
    // Write functions
    "function donate() payable",
    
    // Events
    "event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp)"
];

/**
 * Initialize a contract instance with ethers.js
 * @param {Object} signer - Ethers.js signer object
 * @returns {Object} Contract instance
 */
function initializeContract(signer) {
    if (!signer) {
        throw new Error('Signer is required to initialize contract');
    }
    
    try {
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } catch (error) {
        console.error('Failed to initialize contract:', error);
        throw error;
    }
}

/**
 * Check if the connected wallet is the contract owner
 * @param {Object} contract - Ethers.js contract instance
 * @param {string} address - Wallet address to check
 * @returns {Promise<boolean>} True if address is contract owner
 */
async function isContractOwner(contract, address) {
    if (!contract || !address) {
        return false;
    }
    
    try {
        const owner = await contract.owner();
        return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Failed to check contract owner:', error);
        return false;
    }
}

/**
 * Format blockchain data amounts from Wei to ETH
 * @param {BigNumber|string} amount - Amount in Wei
 * @returns {string} Formatted ETH amount with 4 decimal places
 */
function weiToEth(amount) {
    if (!amount) return '0.0000';
    
    try {
        // Convert to ETH using ethers.js
        const ethValue = ethers.utils.formatEther(amount);
        // Format to 4 decimal places
        return parseFloat(ethValue).toFixed(4);
    } catch (error) {
        console.error('Error converting Wei to ETH:', error);
        return '0.0000';
    }
}

/**
 * Track donation events from the contract
 * @param {Object} contract - Ethers.js contract instance
 * @param {Function} callback - Callback function to handle events
 * @returns {Object} Event listener that can be used to remove the listener
 */
function trackDonationEvents(contract, callback) {
    if (!contract || typeof callback !== 'function') {
        throw new Error('Contract and callback are required');
    }
    
    try {
        // Listen for DonationReceived events
        const eventListener = contract.on('DonationReceived', (donor, amount, timestamp, event) => {
            // Format data
            const donationData = {
                donor,
                amount: weiToEth(amount),
                timestamp: new Date(timestamp.toNumber() * 1000),
                transactionHash: event.transactionHash
            };
            
            // Call the callback with formatted data
            callback(donationData);
        });
        
        return eventListener;
    } catch (error) {
        console.error('Failed to track donation events:', error);
        throw error;
    }
}

/**
 * Get contract state data (total donations, goal, etc.)
 * @param {Object} contract - Ethers.js contract instance
 * @returns {Promise<Object>} Contract state data
 */
async function getContractState(contract) {
    if (!contract) {
        throw new Error('Contract is required');
    }
    
    try {
        // Get all relevant contract data in parallel
        const [totalDonations, fundraisingGoal, charityAddress] = await Promise.all([
            contract.getTotalDonations(),
            contract.getFundraisingGoal(),
            contract.getCharityAddress()
        ]);
        
        return {
            totalDonations: weiToEth(totalDonations),
            fundraisingGoal: weiToEth(fundraisingGoal),
            charityAddress,
            percentComplete: (parseFloat(weiToEth(totalDonations)) / parseFloat(weiToEth(fundraisingGoal))) * 100
        };
    } catch (error) {
        console.error('Failed to get contract state:', error);
        throw error;
    }
}

/**
 * Detect and handle network changes
 * @param {Function} callback - Callback function when network changes
 */
function setupNetworkListener(callback) {
    if (window.ethereum && typeof callback === 'function') {
        window.ethereum.on('chainChanged', (chainId) => {
            // Convert chainId to decimal
            const networkId = parseInt(chainId, 16);
            callback(networkId);
        });
    }
}

/**
 * Check if the current network is supported
 * @returns {Promise<boolean>} True if network is supported
 */
async function isNetworkSupported() {
    if (!window.ethereum) return false;
    
    try {
        // Get network ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkId = parseInt(chainId, 16);
        
        // List of supported networks (1 = Ethereum Mainnet, 3 = Ropsten, 4 = Rinkeby, 5 = Goerli, 42 = Kovan)
        const supportedNetworks = [1, 3, 4, 5, 42];
        
        return supportedNetworks.includes(networkId);
    } catch (error) {
        console.error('Failed to check network:', error);
        return false;
    }
}

/**
 * Get network name from chain ID
 * @param {number} chainId - Chain ID in decimal
 * @returns {string} Network name
 */
function getNetworkName(chainId) {
    const networks = {
        1: 'Ethereum Mainnet',
        3: 'Ropsten Test Network',
        4: 'Rinkeby Test Network',
        5: 'Goerli Test Network',
        42: 'Kovan Test Network',
        56: 'Binance Smart Chain',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai Testnet'
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
}
