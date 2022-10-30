require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
/** @type import('hardhat/config').HardhatUserConfig */

const RPC_URL_GOERLI = process.env.RPC_URL_GOERLI || 0;
const KEY_GOERLI = process.env.KEY_GOERLI || 0;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 0;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || 0;

module.exports = {
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
  },
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: RPC_URL_GOERLI,
      accounts: [KEY_GOERLI],
      chainId: 5,
      blockConfirmations: 2,
    },
    localHost: {
      url: "http://localhost:8545",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: "USD",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
    thirdAccount: {
      default: 2,
    },
  },
};
