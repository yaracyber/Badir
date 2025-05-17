import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.0/dist/ethers.min.js";

// Make contract config variables available
const contractAddress = window.contractAddress;
const contractABI = window.contractABI;

let provider;
let signer;
let contract;

/*******************************************************
 *  On Page Load
 *******************************************************/
window.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded");
    
    const connectButton = document.getElementById("connectButton");
    const donateButton = document.getElementById("donateButton");
    const highestDonationButton = document.getElementById("highestDonationButton");
    const getTotalDonationsButton = document.getElementById("getTotalDonationsButton");
    const getCharityAddressButton = document.getElementById("getCharityAddressButton");

    if (connectButton) connectButton.onclick = connectWallet;
    if (donateButton) donateButton.onclick = donate;
    if (highestDonationButton) highestDonationButton.onclick = getHighestDonation;
    if (getTotalDonationsButton) getTotalDonationsButton.onclick = getTotalDonations;
    if (getCharityAddressButton) getCharityAddressButton.onclick = getCharityAddress;

    // Initialize buttons
    initializeButtons();
    
    // Connect wallet if already authorized
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});

/*******************************************************
 *  Connect Wallet (MetaMask)
 *******************************************************/
async function connectWallet() {
    try {
        console.log('Connecting wallet...');
        if (!window.ethereum) {
            alert('Please install MetaMask to use this dApp!');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log('Connected account:', accounts[0]);

        // Setup provider and signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Initialize contract
        console.log('Initializing contract at:', contractAddress);
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Update UI
        const connectButton = document.getElementById('connectButton');
        if (connectButton) {
            connectButton.textContent = 'Connected';
            connectButton.style.backgroundColor = '#128346';
        }

        // Update other UI elements
        await updateUI();

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet: ' + error.message);
    }
}

// Make connectWallet available globally
window.connectWallet = connectWallet;

/*******************************************************
 *  Donate Function
 *******************************************************/
async function donate() {
    try {
        if (!contract || !signer) {
            alert('Please connect your wallet first!');
            return;
        }

        const amountInput = document.getElementById('amount');
        const amount = amountInput.value;
        
        // Log values for debugging
        console.log('Amount entered:', amount);
        console.log('Parsed amount:', parseFloat(amount));

        // Validate amount
        if (!amount || amount === '') {
            alert('Please enter an amount');
            return;
        }

        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat)) {
            alert('Please enter a valid number');
            return;
        }

        if (amountFloat < 0.2) {
            alert('Minimum donation is 0.2 ETH');
            return;
        }

        if (amountFloat > 20) {
            alert('Maximum donation is 20 ETH');
            return;
        }

        // Disable button and show loading state
        const submitButton = document.getElementById('submitDonateButton');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        try {
            // Convert ETH to Wei and send transaction
            const tx = await contract.donate({
                value: ethers.parseEther(amount.toString())
            });
            
            // Show pending message
            alert('Transaction pending... Please wait.');
            
            // Wait for transaction to be mined
            await tx.wait();
            
            // Show success message
            alert('Donation successful!');
            
            // Reset form
            amountInput.value = '';
            
            // Update stats
            await updateUI();

        } catch (txError) {
            console.error('Transaction error:', txError);
            alert(`Transaction failed: ${txError.message}`);
        }

    } catch (error) {
        console.error('Error in donate function:', error);
        alert('Error processing donation: ' + error.message);
    } finally {
        // Re-enable button and reset text
        const submitButton = document.getElementById('submitDonateButton');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Donate';
        }
    }
}

// Add input validation on the amount field
document.addEventListener('DOMContentLoaded', function() {
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            const submitButton = document.getElementById('submitDonateButton');
            
            if (isNaN(value) || value < 0.2 || value > 20) {
                submitButton.disabled = true;
            } else {
                submitButton.disabled = false;
            }
        });
    }
});

/*******************************************************
 *  Highest Donation (Only Owner)
 *******************************************************/
async function getHighestDonation() {
    const displayElement = document.getElementById("highestDonationDisplay");
    const button = document.getElementById("getHighestDonationButton");
    
    try {
        if (!contract) {
            throw new Error("Please connect your wallet first");
        }

        // Show loading state
        if (button) button.disabled = true;
        displayElement.innerHTML = '<p class="text-gray-500">Loading...</p>';

        try {
            const [amountWei, donor] = await contract.getHighestDonation();
            const amountEth = ethers.formatEther(amountWei);

            displayElement.innerHTML = `
                <div class="flex flex-col">
                    <p class="text-lg font-semibold text-pink-600">
                        ${parseFloat(amountEth).toFixed(4)} ETH
                    </p>
                    <p class="font-mono text-sm">From: ${formatAddress(donor)}</p>
                </div>
            `;
        } catch (error) {
            displayElement.innerHTML = `
                <div class="flex flex-col">
                    <p class="text-red-600 font-semibold">Access Denied</p>
                    <p class="text-sm text-gray-600">Only the owner can view this information</p>
                </div>
            `;
        }
    } catch (error) {
        displayElement.innerHTML = `
            <p class="text-red-600">Please connect your wallet first</p>
        `;
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

/*******************************************************
 *  Total Donations
 *******************************************************/
async function getTotalDonations() {
    const displayElement = document.getElementById("totalDonationsDisplay");
    const button = document.getElementById("getTotalDonationsButton");
    
    try {
        if (!contract) {
            throw new Error("Please connect your wallet first");
        }

        // Show loading state
        button.disabled = true;
        displayElement.innerHTML = '<p class="text-gray-500">Loading...</p>';
        
        // Use the public variable instead of the getter function
        const totalDonationsWei = await contract.totalDonationsAmount();
        const totalDonationsEth = ethers.formatEther(totalDonationsWei);

        // Format the number to 4 decimal places
        const formattedAmount = parseFloat(totalDonationsEth).toFixed(4);
        
        displayElement.innerHTML = `
            <div class="flex flex-col">
                <p class="text-lg font-semibold text-pink-600">${formattedAmount} ETH</p>
                <p class="text-sm text-gray-500">Total donations received</p>
            </div>
        `;

    } catch (error) {
        console.error('Error fetching total donations:', error);
        displayElement.innerHTML = `
            <p class="text-red-600">Error: ${error.message}</p>
        `;
    } finally {
        button.disabled = false;
    }
}

/*******************************************************
 *  Charity Address
 *******************************************************/
async function getCharityAddress() {
    const displayElement = document.getElementById("charityAddressDisplay");
    const button = document.getElementById("getCharityAddressButton");
    
    try {
        if (!contract) {
            throw new Error("Please connect your wallet first");
        }

        // Show loading state
        button.disabled = true;
        displayElement.innerHTML = '<p class="text-gray-500">Loading...</p>';
        
        // Get charity address using the getter function
        const charityAddress = await contract.getAddresses();
        
        // Create elements for copy functionality
        displayElement.innerHTML = `
            <div class="flex flex-col">
                <div class="flex items-center gap-2">
                    <span class="font-mono text-sm">${formatAddress(charityAddress)}</span>
                    <button onclick="copyToClipboard('${charityAddress}')" class="copy-btn">
                        📋
                    </button>
                </div>
                <p class="text-sm text-gray-500">Click to copy full address</p>
            </div>
        `;

    } catch (error) {
        console.error('Error fetching charity address:', error);
        displayElement.innerHTML = `
            <p class="text-red-600">Error: ${error.message}</p>
        `;
    } finally {
        button.disabled = false;
    }
}

// Helper function to copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert('Address copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// Helper function to format addresses
function formatAddress(address) {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Helper function to show loading state
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const originalText = button.textContent;
    
    if (isLoading) {
        button.disabled = true;
        button.textContent = "Loading...";
    } else {
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Listen for network changes
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });

    window.ethereum.on('accountsChanged', () => {
        window.location.reload();
    });
}

// Update UI after connection
async function updateUI() {
    try {
        if (!contract) return;

        // Update total donations
        await getTotalDonations();
        
        // Update charity address
        await getCharityAddress();
        
        // Update owner controls
        await updateOwnerControls();

    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Add this at the end of your app.js
document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        console.log('Connect button found');
        connectButton.addEventListener('click', connectWallet);
    } else {
        console.error('Connect button not found');
    }
});

// Page Navigation Function
function switchPage(pageName) {
    console.log('Switching to page:', pageName);
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-link');
    
    pages.forEach(page => {
        if (page.id === `${pageName}Page`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    navButtons.forEach(button => {
        if (button.dataset.page === pageName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Initialize Navigation
function initializeNavigation() {
    // Set up navigation buttons
    const homeNavButton = document.getElementById('homeNavButton');
    const donateNavButton = document.getElementById('donateNavButton');

    if (homeNavButton) {
        homeNavButton.addEventListener('click', () => switchPage('home'));
    }
    if (donateNavButton) {
        donateNavButton.addEventListener('click', () => switchPage('donate'));
    }
}

// Donation Function
async function submitDonation() {
    try {
        if (!contract || !signer) {
            alert('Please connect your wallet first!');
            return;
        }

        const amountInput = document.getElementById('donationAmount');
        const amount = amountInput.value;
        
        // Validate amount
        if (!amount || amount === '') {
            alert('Please enter an amount');
            return;
        }

        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat)) {
            alert('Please enter a valid number');
            return;
        }

        if (amountFloat < 0.2) {
            alert('Minimum donation is 0.2 ETH');
            return;
        }

        if (amountFloat > 20) {
            alert('Maximum donation is 20 ETH');
            return;
        }

        // Disable button and show loading state
        const submitButton = document.getElementById('submitDonationButton');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        // Convert ETH to Wei and send transaction
        const tx = await contract.donate({
            value: ethers.parseEther(amount.toString())
        });
        
        alert('Transaction pending... Please wait.');
        await tx.wait();
        alert('Donation successful!');
        
        // Reset form and update UI
        amountInput.value = '';
        await updateUI();

    } catch (error) {
        console.error('Error in donation:', error);
        alert('Donation failed: ' + error.message);
    } finally {
        const submitButton = document.getElementById('submitDonationButton');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Donation';
        }
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize donation form
    const submitDonationButton = document.getElementById('submitDonationButton');
    if (submitDonationButton) {
        submitDonationButton.addEventListener('click', submitDonation);
    }

    // Initialize amount input validation
    const amountInput = document.getElementById('donationAmount');
    if (amountInput) {
        amountInput.addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            const submitButton = document.getElementById('submitDonationButton');
            if (submitButton) {
                submitButton.disabled = isNaN(value) || value < 0.2 || value > 20;
            }
        });
    }

    // Initialize wallet connection
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.addEventListener('click', connectWallet);
    }

    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});

// Network change listeners
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });

    window.ethereum.on('accountsChanged', () => {
        window.location.reload();
    });
}

// Add this helper function to check if connected account is owner
async function isContractOwner() {
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const currentAccount = accounts[0];
        const owner = await contract.owner();
        return currentAccount.toLowerCase() === owner.toLowerCase();
    } catch (error) {
        console.error("Error checking owner:", error);
        return false;
    }
}

// You can use it to show/hide the highest donation button
async function updateOwnerControls() {
    const isOwner = await isContractOwner();
    const highestDonationButton = document.getElementById("highestDonationButton");
    if (highestDonationButton) {
        if (!isOwner) {
            highestDonationButton.style.display = "none";
        } else {
            highestDonationButton.style.display = "block";
        }
    }
}

// Add this at the top of your app.js file, after the contract variables
function initializeButtons() {
    console.log("Initializing buttons...");
    
    const highestDonationButton = document.getElementById("getHighestDonationButton");
    if (highestDonationButton) {
        console.log("Found highest donation button");
        highestDonationButton.onclick = async (e) => {
            e.preventDefault();
            console.log("Highest donation button clicked");
            await getHighestDonation();
        };
    } else {
        console.error("Highest donation button not found");
    }
} 