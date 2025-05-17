const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donation Contract", function () {
  let donation;
  let owner;
  let charity;
  let donor1;
  let donor2;
  const minDonation = ethers.utils.parseEther("0.2");
  const maxDonation = ethers.utils.parseEther("20");

  beforeEach(async function () {
    // Get signers (accounts)
    [owner, charity, donor1, donor2] = await ethers.getSigners();
    
    // Deploy the contract
    const Donation = await ethers.getContractFactory("Donation");
    donation = await Donation.deploy(charity.address);
    await donation.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await donation.owner()).to.equal(owner.address);
    });

    it("Should set the right charity address", async function () {
      expect(await donation.charityAddrs()).to.equal(charity.address);
    });

    it("Should start with zero donations", async function () {
      expect(await donation.totalDonationsAmount()).to.equal(0);
      expect(await donation.numberOfFunders()).to.equal(0);
    });
  });

  describe("Donations", function () {
    it("Should allow valid donations within limits", async function () {
      const donationAmount = ethers.utils.parseEther("1");
      
      // Make a donation
      await expect(donation.connect(donor1).donate({ value: donationAmount }))
        .to.emit(donation, "DonationEvent")
        .withArgs(donor1.address, donationAmount);
      
      // Check if donation was recorded correctly
      expect(await donation.totalDonationsAmount()).to.equal(donationAmount);
      expect(await donation.numberOfFunders()).to.equal(1);
    });

    it("Should reject donations below minimum", async function () {
      const tooSmallDonation = ethers.utils.parseEther("0.1");
      
      await expect(
        donation.connect(donor1).donate({ value: tooSmallDonation })
      ).to.be.revertedWith("Minimum donation is 0.2 ETH");
    });

    it("Should reject donations above maximum", async function () {
      const tooLargeDonation = ethers.utils.parseEther("21");
      
      await expect(
        donation.connect(donor1).donate({ value: tooLargeDonation })
      ).to.be.revertedWith("Maximum donation is 20 ETH");
    });

    it("Should prevent self-donations to charity", async function () {
      await expect(
        donation.connect(charity).donate({ value: minDonation })
      ).to.be.revertedWith("You cannot donate to yourself");
    });

    it("Should count unique donors correctly", async function () {
      // First donation from donor1
      await donation.connect(donor1).donate({ value: minDonation });
      expect(await donation.numberOfFunders()).to.equal(1);
      
      // Second donation from donor1 (same donor)
      await donation.connect(donor1).donate({ value: minDonation });
      expect(await donation.numberOfFunders()).to.equal(1);
      
      // Donation from donor2 (new donor)
      await donation.connect(donor2).donate({ value: minDonation });
      expect(await donation.numberOfFunders()).to.equal(2);
    });

    it("Should transfer funds to charity address", async function () {
      const donationAmount = ethers.utils.parseEther("1");
      
      // Get initial charity balance
      const initialCharityBalance = await charity.getBalance();
      
      // Make donation
      await donation.connect(donor1).donate({ value: donationAmount });
      
      // Check if charity received the funds
      const finalCharityBalance = await charity.getBalance();
      expect(finalCharityBalance.sub(initialCharityBalance)).to.equal(donationAmount);
    });
  });

  describe("Owner Functions", function () {
    it("Should track highest donation correctly", async function () {
      // Make first donation
      await donation.connect(donor1).donate({ value: ethers.utils.parseEther("1") });
      
      // Make larger donation
      await donation.connect(donor2).donate({ value: ethers.utils.parseEther("2") });
      
      // Check highest donation (only owner can call this)
      const [amount, donor] = await donation.connect(owner).getHighestDonation();
      expect(amount).to.equal(ethers.utils.parseEther("2"));
      expect(donor).to.equal(donor2.address);
    });

    it("Should prevent non-owners from checking highest donation", async function () {
      await expect(
        donation.connect(donor1).getHighestDonation()
      ).to.be.revertedWith("Only owner can check this");
    });
  });

  describe("Public View Functions", function () {
    it("Should allow anyone to check total donations", async function () {
      // Make donations
      await donation.connect(donor1).donate({ value: ethers.utils.parseEther("1") });
      await donation.connect(donor2).donate({ value: ethers.utils.parseEther("2") });
      
      // Check total from any account
      const total = await donation.connect(donor2).getTotalDonationsAmount();
      expect(total).to.equal(ethers.utils.parseEther("3"));
    });

    it("Should allow anyone to check charity address", async function () {
      const charityAddr = await donation.connect(donor1).getAddresses();
      expect(charityAddr).to.equal(charity.address);
    });
  });
});