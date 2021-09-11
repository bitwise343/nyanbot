require("@nomiclabs/hardhat-waffle")
require('dotenv').config()
require('./scripts/hardhat.tasks.js')


const {
    ARB_ONE_URL,
    ARB_RINKEBY_URL,
    DEV_PRIVATE_KEY
} = process.env


module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // loggingEnabled: true
        },
        arbOne: {
            accounts: [DEV_PRIVATE_KEY],
            url: ARB_ONE_URL
        },
        arbRinkeby: {
            accounts: [DEV_PRIVATE_KEY],
            url: ARB_RINKEBY_URL
        }
    },
    paths: {
        sources: "./contracts",
        cache: "./build/cache",
        artifacts: "./build/artifacts",
        tests: "./test"
    },
    solidity: {
        compilers: [
            { version: "0.8.0" }
        ]
    }
}
