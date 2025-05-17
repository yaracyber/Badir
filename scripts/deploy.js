// Deployment script for Donation.sol contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying Donation contract...");

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get charity address from command line or use a default from Ganache
  // You should replace this with a valid address when deploying
  let charityAddress = process.env.CHARITY_ADDRESS;
  
  // If no charity address is provided, use the second account from the connected network
  if (!charityAddress) {
    const accounts = await ethers.getSigners();
    // Use the second account as charity (first is deployer)
    if (accounts.length > 1) {
      charityAddress = accounts[1].address;
      console.log("Using account 1 as charity address:", charityAddress);
    } else {
      console.error("No charity address provided and couldn't find a second account");
      process.exit(1);
    }
  }

  // Deploy the contract
  const Donation = await ethers.getContractFactory("Donation");
  const donation = await Donation.deploy(charityAddress);

  // Wait for deployment
  await donation.deployed();

  console.log("Donation contract deployed to:", donation.address);
  console.log("Charity address set to:", charityAddress);
  console.log("Contract owner (admin):", deployer.address);

  // Additional verification info for hardhat
  console.log("\nVerification information:");
  console.log("Contract:", donation.address);
  console.log("Constructor arguments:", [charityAddress]);

  // If on a testnet, we can run the verify command
  if (network.name !== "ganache" && network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\nWaiting for block confirmations...");
    // Wait for 6 block confirmations for Etherscan verification
    await donation.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: donation.address,
        constructorArguments: [charityAddress],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }

  // Return the deployed contract and configuration
  return {
    donation: donation.address,
    charity: charityAddress,
    owner: deployer.address,
    network: network.name,
  };
}

// Execute the deployment
main()
  .then((deployedConfig) => {
    console.log("\nDeployment successful!");
    console.log(JSON.stringify(deployedConfig, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });