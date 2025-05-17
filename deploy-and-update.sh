#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Badir Blockchain Charity Platform ===${NC}"
echo -e "${BLUE}=== Deployment & Configuration Script ===${NC}"
echo ""

# Check if Hardhat is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Step 1: Compile the contract
echo -e "${YELLOW}Compiling smart contract...${NC}"
npx hardhat compile

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Contract compilation failed. Please check your contract code.${NC}"
    exit 1
fi

echo -e "${GREEN}Contract compiled successfully.${NC}"
echo ""

# Step 2: Deploy the contract to Ganache
echo -e "${YELLOW}Deploying contract to Ganache...${NC}"
echo -e "${YELLOW}Make sure Ganache is already running!${NC}"
echo ""

# Run the deployment script and capture its output
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network ganache)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Contract deployment failed. Make sure Ganache is running.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment output:${NC}"
echo "$DEPLOY_OUTPUT"
echo ""

# Extract contract address using grep and awk
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Donation contract deployed to:" | awk '{print $5}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: Could not extract contract address from deployment output.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully extracted contract address: ${YELLOW}$CONTRACT_ADDRESS${NC}"
echo ""

# Step 3: Update the contract-config.js file with the new address
echo -e "${YELLOW}Updating contract-config.js with the new contract address...${NC}"

# Use sed to replace the contract address
# Note: this pattern is specific to your contract-config.js structure
sed -i "s|contractAddress: \".*\", // You'll need to deploy your contract on Ganache and update this address|contractAddress: \"$CONTRACT_ADDRESS\", // Contract deployed on $(date)|g" static/js/contract-config.js

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to update contract address in configuration file.${NC}"
    exit 1
fi

echo -e "${GREEN}Contract address updated successfully in configuration file.${NC}"
echo ""

# Step 4: Verification
echo -e "${YELLOW}Verifying configuration file update...${NC}"
grep -n "contractAddress" static/js/contract-config.js
echo ""

echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}DEPLOYMENT PROCESS COMPLETE${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo -e "Contract address: ${YELLOW}$CONTRACT_ADDRESS${NC}"
echo -e "Configuration has been updated."
echo ""
echo -e "${BLUE}You can now run the Flask application:${NC}"
echo -e "${YELLOW}gunicorn --bind 0.0.0.0:5000 --reload main:app${NC}"
echo ""
echo -e "${BLUE}Or start it automatically now? (y/n)${NC}"
read -r START_APP

if [[ $START_APP =~ ^[Yy] ]]; then
    echo -e "${YELLOW}Starting Flask application...${NC}"
    gunicorn --bind 0.0.0.0:5000 --reload main:app
else
    echo -e "${BLUE}Script completed. You can start the application manually when ready.${NC}"
fi