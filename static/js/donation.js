/**
 * Badir - Donation Page JavaScript
 * 
 * This file contains functionality specific to the donation page
 * including wallet connection, donation processing, and contract interactions
 */

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.0/dist/ethers.min.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Donation page initialized");
    
    // UI Elements
    const connectWalletBtn = document.getElementById('connectWallet');
    const walletStatus = document.getElementById('walletStatus');
    const donationForm = document.getElementById('donationForm');
    const progressBar = document.querySelector('#donationProgress .progress-bar');
    const progressText = document.getElementById('progressText');
    const transactionStatus = document.getElementById('transactionStatus');
    const transactionMessage = document.getElementById('transactionMessage');
    const totalAmountElement = document.getElementById('totalAmount');
    const donorCountElement = document.getElementById('donorCount');
    const charityAddressElement = document.getElementById('charityAddress');
    
    // Contract variables
    let provider;
    let signer;
    let contract;
    let currentAccount;
    let isOwner = false;
    
    // App state
    const donationGoal = 10; // ETH
    let isInitialized = false;
    
    /**
     * Connect to Ethereum wallet (MetaMask)
     */
    async function connectWallet() {
        if (connectWalletBtn) {
            connectWalletBtn.disabled = true;
            connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Connecting...';
        }
        
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                showError('MetaMask is not installed. Please install MetaMask to connect your wallet.');
                window.open('https://metamask.io/download.html', '_blank');
                return false;
            }
            
            // Check if on the right network (Ganache = 1337)
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkId = parseInt(chainId, 16);
            
            if (networkId !== 1337) {
                showWarning(`You're connected to ${getNetworkName(networkId)}. Please switch to Ganache Local (Chain ID: 1337) to use this dApp.`);
                
                // Ask user to switch to Ganache
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x539' }], // 1337 in hex
                    });
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x539', // 1337 in hex
                                    chainName: 'Ganache Local',
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['http://127.0.0.1:7545']
                                }],
                            });
                        } catch (addError) {
                            showError('Failed to add Ganache network to MetaMask');
                            return false;
                        }
                    } else {
                        showError('Failed to switch network to Ganache');
                        return false;
                    }
                }
            }
            
            // Request accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentAccount = accounts[0];
            
            // Initialize provider and signer
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            
            // Initialize contract
            await initContract();
            
            // Update UI
            updateWalletUI(currentAccount);
            
            // Set listeners for wallet events
            setupWalletEventListeners();
            
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            showError(error.message || 'Failed to connect wallet');
            return false;
        } finally {
            if (connectWalletBtn) {
                connectWalletBtn.disabled = false;
                if (!currentAccount) {
                    connectWalletBtn.innerHTML = '<i class="fas fa-wallet me-2"></i> Connect Wallet';
                }
            }
        }
    }
    
    /**
     * Initialize contract connection
     */
    async function initContract() {
        try {
            // Use contract configuration from contract.js
            contract = initializeContract(signer);
            
            // Check if user is contract owner
            isOwner = await isContractOwner(contract, currentAccount);
            
            // Show owner controls if applicable
            if (isOwner) {
                document.querySelectorAll('.owner-only').forEach(el => {
                    el.classList.remove('d-none');
                });
            }
            
            // Update contract data in UI
            await updateContractData();
            
            // Setup event listeners for contract events
            trackDonationEvents(contract, handleDonationEvent);
            
            isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing contract:', error);
            showError(error.message || 'Failed to initialize contract');
            return false;
        }
    }
    
    /**
     * Handle account change in MetaMask
     */
    async function handleAccountChange(accounts) {
        if (accounts.length === 0) {
            // User disconnected wallet
            resetConnection();
        } else if (accounts[0] !== currentAccount) {
            // Account changed
            currentAccount = accounts[0];
            updateWalletUI(currentAccount);
            
            // Reinitialize contract for new account
            if (provider) {
                signer = provider.getSigner();
                
                // Update contract with new signer
                if (contract) {
                    await initContract();
                }
            }
        }
    }
    
    /**
     * Setup event listeners for wallet events
     */
    function setupWalletEventListeners() {
        if (window.ethereum) {
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountChange);
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', () => {
                // Refresh page on chain change
                window.location.reload();
            });
        }
    }
    
    /**
     * Reset wallet connection state
     */
    function resetConnection() {
        currentAccount = null;
        isOwner = false;
        isInitialized = false;
        
        // Update UI
        if (connectWalletBtn) {
            connectWalletBtn.innerHTML = '<i class="fas fa-wallet me-2"></i> Connect Wallet';
            connectWalletBtn.classList.remove('connected');
        }
        
        if (walletStatus) {
            walletStatus.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle me-3 text-warning"></i>
                    <p class="text-white-50 mb-0">Please connect your Ethereum wallet to make a donation</p>
                </div>
            `;
        }
        
        // Hide donation form
        if (donationForm) {
            donationForm.style.display = 'none';
        }
        
        // Hide owner-only elements
        document.querySelectorAll('.owner-only').forEach(el => {
            el.classList.add('d-none');
        });
    }
    
    /**
     * Submit donation to the contract
     */
    async function submitDonation(amount) {
        if (!isInitialized || !contract) {
            showError('Contract not initialized. Please connect your wallet.');
            return null;
        }
        
        try {
            // Convert ETH to Wei
            const amountWei = ethers.utils.parseEther(amount.toString());
            
            // Estimate gas limit
            const gasLimit = await contract.estimateGas.donate({ value: amountWei });
            
            // Add buffer to gas limit
            const gasWithBuffer = gasLimit.mul(ethers.BigNumber.from(120)).div(ethers.BigNumber.from(100));
            
            // Submit transaction
            const tx = await contract.donate({
                value: amountWei,
                gasLimit: gasWithBuffer
            });
            
            // Show pending status
            showTransactionStatus(`Transaction sent! Waiting for confirmation...`, 'info');
            
            // Wait for transaction to be mined
            const receipt = await tx.wait();
            
            // Update donation progress
            await updateContractData();
            
            return {
                hash: tx.hash,
                receipt: receipt,
                status: receipt.status === 1 ? 'success' : 'failed'
            };
        } catch (error) {
            console.error('Error submitting donation:', error);
            throw error;
        }
    }
    
    /**
     * Update donation progress from contract
     */
    async function updateContractData() {
        if (!contract) return;
        
        try {
            // Get contract state
            const state = await getContractState(contract);
            
            // Update progress bar
            updateDonationProgress(state.totalDonations, state.fundraisingGoal || donationGoal);
            
            // Update charity address display
            if (charityAddressElement && state.charityAddress) {
                charityAddressElement.textContent = state.charityAddress;
            }
            
            // If we're the owner, get highest donation
            if (isOwner) {
                try {
                    const [highestAmount, highestDonor] = await contract.getHighestDonation();
                    
                    // Update highest donation display if available
                    const highestDonationElement = document.getElementById('highestDonation');
                    if (highestDonationElement) {
                        highestDonationElement.textContent = weiToEth(highestAmount) + ' ETH';
                    }
                    
                    const highestDonorElement = document.getElementById('highestDonor');
                    if (highestDonorElement && highestDonor !== ethers.constants.AddressZero) {
                        highestDonorElement.textContent = formatAddress(highestDonor);
                    }
                } catch (error) {
                    console.warn('Could not fetch highest donation:', error);
                }
            }
        } catch (error) {
            console.error('Error updating contract data:', error);
        }
    }
    
    /**
     * Handle donation event from contract
     */
    function handleDonationEvent(data) {
        console.log('Donation event:', data);
        
        // Update donation data
        updateContractData();
        
        // Show notification
        showNotification(`New donation of ${data.amount} ETH received!`, 'success');
        
        // Update donation feed if available
        const donationFeed = document.getElementById('donation-feed');
        if (donationFeed) {
            const donationItem = document.createElement('div');
            donationItem.className = 'donation-item';
            donationItem.innerHTML = `
                <div class="donor">${formatAddress(data.donor)}</div>
                <div class="amount">${data.amount} ETH</div>
                <div class="time">${formatTimeAgo(data.timestamp)}</div>
            `;
            
            // Add to the feed (newest first)
            donationFeed.insertBefore(donationItem, donationFeed.firstChild);
            
            // Limit feed to 10 items
            if (donationFeed.children.length > 10) {
                donationFeed.removeChild(donationFeed.lastChild);
            }
        }
    }
    
    /**
     * Update the UI when wallet is connected
     */
    function updateWalletUI(account) {
        if (!account) return;
        
        // Format the address to show only first 6 and last 4 characters
        const formattedAddress = formatAddress(account);
        
        // Update connect wallet button
        if (connectWalletBtn) {
            connectWalletBtn.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${formattedAddress}`;
            connectWalletBtn.classList.add('connected');
        }
        
        // Update wallet status display
        if (walletStatus) {
            walletStatus.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-check-circle me-3 text-success"></i>
                    <div>
                        <p class="text-white mb-1">Wallet Connected</p>
                        <div class="wallet-address">${account}</div>
                    </div>
                </div>
            `;
        }
        
        // Show donation form
        if (donationForm) {
            donationForm.style.display = 'block';
        }
    }
    
    /**
     * Update donation progress bar
     */
    function updateDonationProgress(amount, goal) {
        const amountFloat = parseFloat(amount);
        const goalFloat = parseFloat(goal || donationGoal);
        const percentage = Math.min(100, (amountFloat / goalFloat) * 100);
        
        if (progressBar) {
            progressBar.style.width = percentage + '%';
            progressBar.setAttribute('aria-valuenow', percentage);
            progressBar.textContent = percentage.toFixed(1) + '%';
        }
        
        if (progressText) {
            progressText.textContent = `${amountFloat.toFixed(2)} ETH of ${goalFloat.toFixed(2)} ETH`;
        }
        
        if (totalAmountElement) {
            totalAmountElement.textContent = amountFloat.toFixed(2) + ' ETH';
        }
    }
    
    /**
     * Format Ethereum address to abbreviated form
     */
    function formatAddress(address) {
        if (!address) return '';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }
    
    /**
     * Format time ago from timestamp
     */
    function formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        
        const now = new Date();
        const time = new Date(timestamp);
        const seconds = Math.floor((now - time) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 120) return '1 minute ago';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 7200) return '1 hour ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 172800) return '1 day ago';
        
        return Math.floor(seconds / 86400) + ' days ago';
    }
    
    /**
     * Show transaction status message
     */
    function showTransactionStatus(message, type = 'info') {
        if (!transactionStatus || !transactionMessage) return;
        
        const iconClass = {
            'info': 'fas fa-info-circle text-info',
            'success': 'fas fa-check-circle text-success',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'danger': 'fas fa-times-circle text-danger'
        }[type] || 'fas fa-info-circle text-info';
        
        // Update spinner based on status type
        const spinner = transactionStatus.querySelector('.spinner-border');
        if (spinner) {
            if (type === 'info') {
                spinner.classList.remove('d-none');
            } else {
                spinner.classList.add('d-none');
            }
        }
        
        // Update message with appropriate icon
        transactionMessage.innerHTML = `<i class="${iconClass} me-2"></i> ${message}`;
        
        // Show the status container
        transactionStatus.style.display = 'block';
        
        // If status is final (not info), hide after delay
        if (type !== 'info') {
            setTimeout(() => {
                transactionStatus.style.display = 'none';
            }, 8000);
        }
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon fas ${type === 'success' ? 'fa-check-circle' : 
                                              type === 'warning' ? 'fa-exclamation-triangle' : 
                                              type === 'danger' ? 'fa-times-circle' : 
                                              'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Show the notification (with animation)
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Close notification when close button is clicked
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            });
        }
        
        // Auto-close after duration
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        showNotification(message, 'danger', 8000);
    }
    
    /**
     * Show warning message
     */
    function showWarning(message) {
        showNotification(message, 'warning', 8000);
    }
    
    // ====== Event Listeners ======
    
    // Connect wallet button click
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Donation form submission
    if (donationForm) {
        donationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const amountInput = document.getElementById('donationAmount');
            const amount = parseFloat(amountInput.value);
            
            if (isNaN(amount) || amount <= 0) {
                showError('Please enter a valid donation amount');
                return;
            }
            
            try {
                // Submit donation
                const result = await submitDonation(amount);
                
                if (result && result.status === 'success') {
                    // Show success message
                    showTransactionStatus(`
                        <span class="text-success">Donation Successful!</span><br>
                        <small>Amount: ${amount} ETH<br>
                        Transaction: <a href="https://goerli.etherscan.io/tx/${result.hash}" target="_blank" rel="noopener" class="text-gold">
                            ${formatAddress(result.hash)}
                        </a></small>
                    `, 'success');
                    
                    // Reset form
                    donationForm.reset();
                } else {
                    showTransactionStatus('Transaction failed. Please try again.', 'danger');
                }
            } catch (error) {
                console.error('Donation error:', error);
                showTransactionStatus(`Error: ${error.message || 'Transaction failed'}`, 'danger');
            }
        });
    }
    
    // Check if wallet was previously connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        // Auto-connect
        connectWallet();
    }
});