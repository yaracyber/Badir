const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const Donation = await hre.ethers.getContractFactory("Donation");
  
  // Deploy the contract with your charity address
  // Replace this with your actual charity address
  const charityAddress = "0x814EED06116D50b17b1d04bE5200b9699aa918e0"; 
  const donation = await Donation.deploy(charityAddress);

  // Wait for deployment
  await donation.waitForDeployment();
  
  // Get the deployed contract address
  const deployedAddress = await donation.getAddress();
  
  console.log("Donation contract deployed to:", deployedAddress);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

