/**
 * Badir Donation Contract Integration
 * This file contains functions to interact with the smart contract
 */

let donationContract;
let signer;
let provider;
let isOwner = false;

/**
 * Initialize connection to the blockchain and contract
 */
async function initializeBlockchainConnection() {
    try {
        // Check if provider is available
        if (window.ethereum) {
            console.log("Ethereum provider detected");
            
            // Connect to provider
            provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Get network details
            const network = await provider.getNetwork();
            console.log("Connected to network:", network.name, "(", network.chainId, ")");
            
            // Check if connected to the right network
            if (network.chainId !== currentConfig.networkId) {
                console.warn("Warning: You are connected to", network.name, "not to", currentConfig.networkName);
                displayNetworkWarning(network.name);
                return false;
            }
            
            return true;
        } else {
            console.error("No Ethereum provider found");
            displayWalletWarning();
            return false;
        }
    } catch (error) {
        console.error("Error initializing blockchain connection:", error);
        return false;
    }
}

/**
 * Initialize the contract with user wallet
 * @returns {Promise<boolean>} - True if successful
 */
async function initializeContract() {
    try {
        // Get user accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        
        if (!userAddress) {
            console.error("No account found");
            return false;
        }
        
        // Set up signer and contract
        signer = provider.getSigner();
        donationContract = new ethers.Contract(
            currentConfig.contractAddress,
            donationContractABI,
            signer
        );
        
        // Check if user is contract owner
        const ownerAddress = await donationContract.owner();
        isOwner = (ownerAddress.toLowerCase() === userAddress.toLowerCase());
        
        if (isOwner) {
            console.log("User is the contract owner");
            // Show owner-specific UI elements if needed
            const ownerElements = document.querySelectorAll('.owner-only');
            ownerElements.forEach(el => el.classList.remove('d-none'));
        }
        
        // Set up event listeners for contract events
        setupContractEventListeners();
        
        return true;
    } catch (error) {
        console.error("Error initializing contract:", error);
        return false;
    }
}

/**
 * Make a donation to the charity
 * @param {string} amount - Donation amount in ETH
 * @returns {Promise<Object>} - Transaction result
 */
async function makeDonation(amount) {
    try {
        if (!donationContract) {
            throw new Error("Contract not initialized");
        }
        
        // Convert ETH to Wei
        const amountWei = ethers.utils.parseEther(amount);
        
        // Check minimum and maximum donation limits
        const minDonation = await donationContract.MIN_DONATION();
        const maxDonation = await donationContract.MAX_DONATION();
        
        if (amountWei.lt(minDonation)) {
            throw new Error(`Donation must be at least ${ethers.utils.formatEther(minDonation)} ETH`);
        }
        
        if (amountWei.gt(maxDonation)) {
            throw new Error(`Donation cannot exceed ${ethers.utils.formatEther(maxDonation)} ETH`);
        }
        
        // Make the donation
        const tx = await donationContract.donate({
            value: amountWei,
            gasLimit: 300000
        });
        
        // Wait for transaction confirmation
        console.log("Transaction hash:", tx.hash);
        return {
            status: "pending",
            hash: tx.hash,
            receipt: await tx.wait()
        };
    } catch (error) {
        console.error("Error making donation:", error);
        throw error;
    }
}

/**
 * Get total donation amounts
 * @returns {Promise<string>} - Total donations in ETH
 */
async function getTotalDonations() {
    try {
        if (!donationContract) {
            throw new Error("Contract not initialized");
        }
        
        const totalWei = await donationContract.getTotalDonationsAmount();
        return ethers.utils.formatEther(totalWei);
    } catch (error) {
        console.error("Error getting total donations:", error);
        throw error;
    }
}

/**
 * Get charity address from the contract
 * @returns {Promise<string>} - Charity address
 */
async function getCharityAddress() {
    try {
        if (!donationContract) {
            throw new Error("Contract not initialized");
        }
        
        return await donationContract.charityAddrs();
    } catch (error) {
        console.error("Error getting charity address:", error);
        throw error;
    }
}

/**
 * Get highest donation (owner only)
 * @returns {Promise<Object>} - Highest donation and donor
 */
async function getHighestDonation() {
    try {
        if (!donationContract) {
            throw new Error("Contract not initialized");
        }
        
        if (!isOwner) {
            throw new Error("Only the contract owner can access this information");
        }
        
        const [amountWei, donorAddress] = await donationContract.getHighestDonation();
        
        return {
            amount: ethers.utils.formatEther(amountWei),
            donor: donorAddress
        };
    } catch (error) {
        console.error("Error getting highest donation:", error);
        throw error;
    }
}

/**
 * Get number of unique donors
 * @returns {Promise<number>} - Number of donors
 */
async function getNumberOfDonors() {
    try {
        if (!donationContract) {
            throw new Error("Contract not initialized");
        }
        
        const numberOfFunders = await donationContract.numberOfFunders();
        return numberOfFunders.toNumber();
    } catch (error) {
        console.error("Error getting number of donors:", error);
        throw error;
    }
}

/**
 * Set up event listeners for contract events
 */
function setupContractEventListeners() {
    if (!donationContract) return;
    
    // Listen for donation events
    donationContract.on("DonationEvent", (donor, amount, event) => {
        console.log("New donation received:", {
            donor: donor,
            amount: ethers.utils.formatEther(amount),
            transactionHash: event.transactionHash
        });
        
        // Update UI with new donation
        updateDonationFeed(donor, amount, event.transactionHash);
    });
}

/**
 * Update the UI with new donation data
 * @param {string} donor - Donor address
 * @param {BigNumber} amount - Donation amount in Wei
 * @param {string} txHash - Transaction hash
 */
function updateDonationFeed(donor, amount, txHash) {
    const donationFeed = document.getElementById('donation-feed');
    if (!donationFeed) return;
    
    const amountEth = ethers.utils.formatEther(amount);
    const shortDonor = donor.substring(0, 6) + '...' + donor.substring(donor.length - 4);
    const shortTx = txHash.substring(0, 6) + '...' + txHash.substring(txHash.length - 4);
    
    const newDonation = document.createElement('div');
    newDonation.className = 'donation-item';
    newDonation.innerHTML = `
        <div class="donation-amount">${amountEth} ETH</div>
        <div class="donation-from">From: ${shortDonor}</div>
        <div class="donation-tx">
            <a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank" rel="noopener noreferrer">
                ${shortTx}
            </a>
        </div>
    `;
    
    // Add to the feed
    donationFeed.prepend(newDonation);
    
    // Update total donated amount
    updateTotalDonated();
}

/**
 * Update total donated amount in the UI
 */
async function updateTotalDonated() {
    try {
        const totalDonationElement = document.getElementById('total-donation-amount');
        if (!totalDonationElement) return;
        
        const totalDonated = await getTotalDonations();
        totalDonationElement.textContent = `${totalDonated} ETH`;
    } catch (error) {
        console.error("Error updating total donations:", error);
    }
}

/**
 * Display warning about wrong network
 * @param {string} currentNetwork - Current network name
 */
function displayNetworkWarning(currentNetwork) {
    const warningElement = document.createElement('div');
    warningElement.className = 'network-warning';
    warningElement.innerHTML = `
        <div class="alert alert-warning" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            You are connected to <strong>${currentNetwork}</strong>. 
            Please switch to <strong>${currentConfig.networkName}</strong> to interact with this dApp.
        </div>
    `;
    
    // Add to page
    document.body.insertBefore(warningElement, document.body.firstChild);
}

/**
 * Display warning about missing wallet
 */
function displayWalletWarning() {
    const warningElement = document.createElement('div');
    warningElement.className = 'wallet-warning';
    warningElement.innerHTML = `
        <div class="alert alert-warning" role="alert">
            <i class="fas fa-wallet me-2"></i>
            No Ethereum wallet detected. Please install 
            <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">MetaMask</a> 
            to interact with this dApp.
        </div>
    `;
    
    // Add to page
    document.body.insertBefore(warningElement, document.body.firstChild);
}