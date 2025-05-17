/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // Local development with Ganache
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337
    }
  }
};