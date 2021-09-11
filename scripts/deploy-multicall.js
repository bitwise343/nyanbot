const { ethers } = require('hardhat')
const { deployContract } = require('./hardhat.utils.js')


const deployer = async() => {
    const multicall = await deployContract('Multicall2')
}

try {
    deployer()
} catch (err) {
    console.error(err)
}
