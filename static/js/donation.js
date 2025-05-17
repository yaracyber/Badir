/**
 * Badir - Donation Page JavaScript
 * 
 * This file contains functionality specific to the donation page
 * including wallet connection, donation processing, and contract interactions
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Donation page initialized');
    
    // DOM Elements
    const connectWalletBtn = document.getElementById('connectWallet');
    const donationForm = document.getElementById('donationForm');
    const walletStatus = document.getElementById('walletStatus');
    const submitDonationBtn = document.getElementById('submitDonation');
    const donationAmount = document.getElementById('donationAmount');
    const transactionStatus = document.getElementById('transactionStatus');
    const transactionMessage = document.getElementById('transactionMessage');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.getElementById('progressText');
    
    // Contract info buttons
    const getHighestDonationBtn = document.getElementById('getHighestDonation');
    const getTotalDonationsBtn = document.getElementById('getTotalDonations');
    const getCharityAddressBtn = document.getElementById('getCharityAddress');
    
    // Contract info display areas
    const highestDonationInfo = document.getElementById('highestDonationInfo');
    const totalDonationsInfo = document.getElementById('totalDonationsInfo');
    const charityAddressInfo = document.getElementById('charityAddressInfo');
    const fundraisingGoalInfo = document.getElementById('fundraisingGoalInfo');
    
    // State variables
    let connectedAccount = null;
    let provider = null;
    let signer = null;
    let contract = null;
    let contractOwner = null;
    
    // Connect wallet button
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async function() {
            try {
                await connectWallet();
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                showNotification('Failed to connect wallet: ' + error.message, 'danger');
            }
        });
    }
    
    // Donation form submission
    if (donationForm) {
        donationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!connectedAccount) {
                showNotification('Please connect your wallet first', 'warning');
                return;
            }
            
            const amount = parseFloat(donationAmount.value);
            if (isNaN(amount) || amount < 0.2 || amount > 20) {
                showNotification('Please enter a valid amount between 0.2 and 20 ETH', 'warning');
                return;
            }
            
            try {
                await submitDonation(amount);
            } catch (error) {
                console.error('Donation failed:', error);
                showNotification('Donation failed: ' + error.message, 'danger');
                hideTransactionStatus();
            }
        });
    }
    
    // Contract info buttons
    if (getHighestDonationBtn) {
        getHighestDonationBtn.addEventListener('click', async function() {
            if (!contract) {
                showNotification('Please connect your wallet first', 'warning');
                return;
            }
            
            try {
                await getHighestDonation();
            } catch (error) {
                console.error('Failed to get highest donation:', error);
                showNotification('Failed to get highest donation: ' + error.message, 'danger');
            }
        });
    }
    
    if (getTotalDonationsBtn) {
        getTotalDonationsBtn.addEventListener('click', async function() {
            if (!contract) {
                showNotification('Please connect your wallet first', 'warning');
                return;
            }
            
            try {
                await getTotalDonations();
            } catch (error) {
                console.error('Failed to get total donations:', error);
                showNotification('Failed to get total donations: ' + error.message, 'danger');
            }
        });
    }
    
    if (getCharityAddressBtn) {
        getCharityAddressBtn.addEventListener('click', async function() {
            if (!contract) {
                showNotification('Please connect your wallet first', 'warning');
                return;
            }
            
            try {
                await getCharityAddress();
            } catch (error) {
                console.error('Failed to get charity address:', error);
                showNotification('Failed to get charity address: ' + error.message, 'danger');
            }
        });
    }
    
    /**
     * Connect to Ethereum wallet (MetaMask)
     */
    async function connectWallet() {
        if (window.ethereum) {
            try {
                // Update UI to loading state
                connectWalletBtn.disabled = true;
                connectWalletBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Connecting...';
                
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                connectedAccount = accounts[0];
                
                // Initialize ethers provider
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                
                // Initialize contract
                await initContract();
                
                // Update UI elements
                walletStatus.className = 'alert alert-success mb-4';
                walletStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i> Wallet connected: ${formatAddress(connectedAccount)}`;
                connectWalletBtn.style.display = 'none';
                donationForm.style.display = 'block';
                
                // Update fundraising progress
                await updateDonationProgress();
                
                // Check if connected account is contract owner
                if (connectedAccount && contractOwner && 
                    connectedAccount.toLowerCase() === contractOwner.toLowerCase()) {
                    // Enable owner-only functions
                    getHighestDonationBtn.disabled = false;
                } else {
                    // Disable owner-only functions
                    getHighestDonationBtn.disabled = true;
                    highestDonationInfo.innerHTML = '<p>Only contract owner can view this information</p>';
                }
                
                // Setup wallet change listener
                window.ethereum.on('accountsChanged', handleAccountChange);
                
                // Show success notification
                showNotification('Wallet connected successfully!', 'success');
                
            } catch (error) {
                console.error('Error connecting wallet:', error);
                walletStatus.className = 'alert alert-danger mb-4';
                walletStatus.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Failed to connect: ${error.message}`;
                
                // Reset connect button
                connectWalletBtn.disabled = false;
                connectWalletBtn.innerHTML = '<i class="fas fa-wallet me-2"></i> Connect Wallet';
                
                throw error;
            }
        } else {
            walletStatus.className = 'alert alert-danger mb-4';
            walletStatus.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> MetaMask is not installed. Please install MetaMask to use this feature.';
            throw new Error('Ethereum provider not found. Please install MetaMask.');
        }
    }
    
    /**
     * Initialize contract connection
     */
    async function initContract() {
        // These would typically come from a config file or environment variables
        const contractAddress = '0x123456789abcdef123456789abcdef123456789a'; // Replace with actual contract address
        
        // Contract ABI - minimal ABI for donation functionality
        const contractABI = [
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
        
        try {
            // Connect to contract with signer for sending transactions
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            
            // Get contract owner
            contractOwner = await contract.owner();
            
            console.log('Contract initialized');
            return contract;
        } catch (error) {
            console.error('Failed to initialize contract:', error);
            showNotification('Failed to initialize contract. Please try again.', 'danger');
            throw error;
        }
    }
    
    /**
     * Handle account change in MetaMask
     */
    async function handleAccountChange(accounts) {
        if (accounts.length === 0) {
            // User disconnected all accounts
            resetWalletConnection();
        } else {
            // User switched accounts
            connectedAccount = accounts[0];
            
            // Update signer
            signer = provider.getSigner();
            
            // Update contract with new signer
            contract = contract.connect(signer);
            
            // Update UI
            walletStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i> Wallet connected: ${formatAddress(connectedAccount)}`;
            
            // Check if new account is contract owner
            if (connectedAccount && contractOwner && 
                connectedAccount.toLowerCase() === contractOwner.toLowerCase()) {
                // Enable owner-only functions
                getHighestDonationBtn.disabled = false;
            } else {
                // Disable owner-only functions
                getHighestDonationBtn.disabled = true;
                highestDonationInfo.innerHTML = '<p>Only contract owner can view this information</p>';
            }
            
            // Show notification
            showNotification('Account changed to ' + formatAddress(connectedAccount), 'info');
        }
    }
    
    /**
     * Reset wallet connection state
     */
    function resetWalletConnection() {
        // Reset state variables
        connectedAccount = null;
        provider = null;
        signer = null;
        contract = null;
        
        // Update UI
        walletStatus.className = 'alert alert-warning mb-4';
        walletStatus.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> Please connect your Ethereum wallet to continue';
        connectWalletBtn.style.display = 'block';
        connectWalletBtn.disabled = false;
        connectWalletBtn.innerHTML = '<i class="fas fa-wallet me-2"></i> Connect Wallet';
        donationForm.style.display = 'none';
        
        // Reset contract info displays
        highestDonationInfo.innerHTML = '<p>Connect wallet to view information</p>';
        totalDonationsInfo.innerHTML = '<p>Connect wallet to view information</p>';
        charityAddressInfo.innerHTML = '<p>Connect wallet to view information</p>';
        
        // Show notification
        showNotification('Wallet disconnected', 'warning');
    }
    
    /**
     * Submit donation to the contract
     */
    async function submitDonation(amount) {
        if (!contract || !connectedAccount) {
            showNotification('Wallet not connected', 'warning');
            return;
        }
        
        try {
            // Show transaction in progress
            showTransactionStatus('Processing your donation...');
            
            // Convert amount to Wei
            const amountInWei = ethers.utils.parseEther(amount.toString());
            
            // Send transaction
            const tx = await contract.donate({ value: amountInWei });
            
            // Update status
            updateTransactionStatus('Transaction submitted! Waiting for confirmation...', 'info');
            
            // Wait for transaction to be mined
            await tx.wait();
            
            // Transaction confirmed
            hideTransactionStatus();
            showNotification('Donation of ' + amount + ' ETH successful!', 'success');
            
            // Update UI
            donationAmount.value = '';
            document.getElementById('donorMessage').value = '';
            
            // Update donation progress
            await updateDonationProgress();
            
        } catch (error) {
            console.error('Donation failed:', error);
            hideTransactionStatus();
            throw error;
        }
    }
    
    /**
     * Update the donation progress bar
     */
    async function updateDonationProgress() {
        if (!contract) return;
        
        try {
            // Get total donations and goal
            const totalDonations = await contract.getTotalDonations();
            const fundraisingGoal = await contract.getFundraisingGoal();
            
            // Convert from Wei to ETH
            const totalEth = parseFloat(ethers.utils.formatEther(totalDonations));
            const goalEth = parseFloat(ethers.utils.formatEther(fundraisingGoal));
            
            // Calculate percentage
            const percentage = Math.min((totalEth / goalEth) * 100, 100);
            
            // Update UI
            progressBar.style.width = `${percentage}%`;
            progressBar.innerText = `${percentage.toFixed(1)}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressText.innerText = `${totalEth.toFixed(2)} ETH of ${goalEth.toFixed(2)} ETH`;
            
            // Update fundraising goal info
            fundraisingGoalInfo.innerHTML = `<p>Our current goal is ${goalEth.toFixed(2)} ETH</p>`;
            
        } catch (error) {
            console.error('Failed to update donation progress:', error);
        }
    }
    
    /**
     * Get the highest donation (owner only)
     */
    async function getHighestDonation() {
        if (!contract || !connectedAccount) return;
        
        try {
            // Show loading state
            highestDonationInfo.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            
            // Check if connected account is owner
            if (connectedAccount.toLowerCase() !== contractOwner.toLowerCase()) {
                highestDonationInfo.innerHTML = '<p class="text-danger">Only contract owner can view this information</p>';
                return;
            }
            
            // Call contract function
            const { donor, amount } = await contract.getHighestDonation();
            
            // Format amount from Wei to ETH
            const amountInEth = ethers.utils.formatEther(amount);
            
            // Update UI
            highestDonationInfo.innerHTML = `
                <p><strong>Donor:</strong> ${formatAddress(donor)}</p>
                <p><strong>Amount:</strong> ${parseFloat(amountInEth).toFixed(4)} ETH</p>
            `;
            
        } catch (error) {
            console.error('Failed to get highest donation:', error);
            highestDonationInfo.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
            throw error;
        }
    }
    
    /**
     * Get total donations
     */
    async function getTotalDonations() {
        if (!contract) return;
        
        try {
            // Show loading state
            totalDonationsInfo.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            
            // Call contract function
            const totalDonations = await contract.getTotalDonations();
            
            // Format amount from Wei to ETH
            const totalInEth = ethers.utils.formatEther(totalDonations);
            
            // Update UI
            totalDonationsInfo.innerHTML = `
                <p><strong>Total Donated:</strong> ${parseFloat(totalInEth).toFixed(4)} ETH</p>
            `;
            
        } catch (error) {
            console.error('Failed to get total donations:', error);
            totalDonationsInfo.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
            throw error;
        }
    }
    
    /**
     * Get charity address
     */
    async function getCharityAddress() {
        if (!contract) return;
        
        try {
            // Show loading state
            charityAddressInfo.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            
            // Call contract function
            const charityAddress = await contract.getCharityAddress();
            
            // Update UI
            charityAddressInfo.innerHTML = `
                <p><strong>Charity Address:</strong> ${formatAddress(charityAddress)}</p>
                <p class="small text-muted">${charityAddress}</p>
            `;
            
        } catch (error) {
            console.error('Failed to get charity address:', error);
            charityAddressInfo.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
            throw error;
        }
    }
    
    /**
     * Show transaction status message
     */
    function showTransactionStatus(message, type = 'info') {
        if (!transactionStatus || !transactionMessage) return;
        
        transactionStatus.style.display = 'block';
        transactionMessage.innerText = message;
        
        // Update alert class based on type
        const alertElement = transactionStatus.querySelector('.alert');
        if (alertElement) {
            alertElement.className = `alert alert-${type}`;
        }
    }
    
    /**
     * Update transaction status message
     */
    function updateTransactionStatus(message, type = 'info') {
        if (!transactionStatus || !transactionMessage) return;
        
        transactionMessage.innerText = message;
        
        // Update alert class based on type
        const alertElement = transactionStatus.querySelector('.alert');
        if (alertElement) {
            alertElement.className = `alert alert-${type}`;
        }
    }
    
    /**
     * Hide transaction status message
     */
    function hideTransactionStatus() {
        if (!transactionStatus) return;
        transactionStatus.style.display = 'none';
    }
    
    // Initialize fundraising goal display (default/static value)
    if (fundraisingGoalInfo) {
        fundraisingGoalInfo.innerHTML = '<p>Our current goal is 10 ETH</p>';
    }
    
    // Check if MetaMask is already connected and initialize if so
    if (window.ethereum && window.ethereum.isConnected() && window.ethereum.selectedAddress) {
        try {
            console.log('MetaMask already connected, initializing...');
            connectWallet();
        } catch (error) {
            console.error('Error auto-connecting to wallet:', error);
        }
    }
});
