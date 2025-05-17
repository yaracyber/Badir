// SPDX-License-Identifier:MIT
pragma solidity 0.8.28;

contract Donation {
    
    bool private locked;

    address immutable public owner;
    address payable immutable public charityAddrs;
    address private highestDonor; 

    uint public numberOfFunders;
    uint256 public totalDonationsAmount;
    uint256 private highestDonation;
    uint256 private donationAmount;
    
    uint256 public constant MIN_DONATION = 0.2 ether; 
    uint256 public constant MAX_DONATION = 20 ether; 

    mapping (uint=>address) private funders;
    mapping (address=>bool) private successFunders;

    constructor (address payable charityAddress_) {
        owner = msg.sender;

        require(charityAddress_ != address(0), "Invalid charity address");
        charityAddrs= charityAddress_;

        donationAmount = 0;
        totalDonationsAmount = 0;
        highestDonation = 0;
    } 

    modifier onlyOwner{
        require(msg.sender == owner,"Only owner can check this");
        _;
    }
    
    modifier nonReentrant(){
        require(!locked , "Reentrant donate function called");
        locked = true; 
        _;
        locked = false;
    }

     modifier noContracts() {
    require(tx.origin == msg.sender, "No contracts allowed");
    _;
    }
    
    modifier validateDestination(address payable destinationAddress) {
        require(msg.sender != destinationAddress, "You cannot donate to yourself");
        _;
    }

    modifier withinDonationLimits(uint256 amount) {
    require(amount >= MIN_DONATION, "Minimum donation is 0.2 ETH");
    require(amount <= MAX_DONATION, "Maximum donation is 20 ETH");
    _;
    }

    event DonationEvent(    
        address indexed funder,
        uint256 value
    );
      
   
    function donate() external payable withinDonationLimits(msg.value) validateDestination(charityAddrs) nonReentrant noContracts {
        address funder = msg.sender;

        if (!successFunders[funder]){
            uint index = numberOfFunders++;
            funders[index] = funder;
            successFunders[funder] = true;
        }

        donationAmount = msg.value;  
        totalDonationsAmount += msg.value;

        if (donationAmount > highestDonation) {
            highestDonation = donationAmount;
            highestDonor = msg.sender;
        }
        
        emit DonationEvent(funder, msg.value);

        charityAddrs.transfer(msg.value);

        

    }

    function getHighestDonation() public view onlyOwner() returns (uint256, address)  {
        return (highestDonation, highestDonor);
    }

     function getAddresses() public view returns (address payable ) {
        return charityAddrs;
    }

    function getTotalDonationsAmount() public view returns (uint256) {
        return totalDonationsAmount;
    }

}

