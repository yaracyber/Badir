const hre = require("hardhat");

async function main() {
  console.log("Deploying Donation contract...");

  // Get the contract factory
  const Donation = await hre.ethers.getContractFactory("Donation");
  
  // You can either use a hardcoded charity address or get the second account from Ganache
  // Method 1: Hardcoded charity address (safer for production)
  const charityAddress = "0x814EED06116D50b17b1d04bE5200b9699aa918e0"; 
  
  // Method 2: Get from environment variable (for flexibility)
  // const charityAddress = process.env.CHARITY_ADDRESS || "0x814EED06116D50b17b1d04bE5200b9699aa918e0";
  
  // Method 3: Use second account from Ganache (for development)
  // const [deployer, charity] = await hre.ethers.getSigners();
  // const charityAddress = charity.address;
  
  console.log("Using charity address:", charityAddress);
  
  // Deploy the contract with your charity address
  const donation = await Donation.deploy(charityAddress);

  // Wait for deployment
  await donation.waitForDeployment();
  
  // Get the deployed contract address
  const deployedAddress = await donation.getAddress();
  
  console.log("Donation contract deployed to:", deployedAddress);
  console.log("Charity address set to:", charityAddress);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });