const { Contract, Provider } = require('ethers-multicall')

const contracts = require('../abis/contractAddresses')
const nyanTokenAbi = require('../abis/nyanToken')
const ethRewardsAbi = require('../abis/ethRewards')
const nyanRewardsAbi = require('../abis/nyanRewards')
const nyanEthRewardsAbi = require('../abis/nyanEthRewards')
const sushiRouterAbi = require('../abis/uniswapRouterV2')
const sushiPairAbi = require('../abis/uniswapV2Pair')


const delay = ms => new Promise(res => setTimeout(res, ms))

class NyanBot {
    constructor(provider) {
        this.ethcallProvider = new Provider(provider, 42161)
        this.nyanTokenContract = new Contract(contracts.nyanToken, nyanTokenAbi)
        this.nyanRewardsContract = new Contract(contracts.nyanRewards, nyanRewardsAbi)
        this.ethRewardsContract = new Contract(contracts.ethRewards, ethRewardsAbi)
        this.nyanEthRewardsContract = new Contract(contracts.nyanEthRewards, nyanEthRewardsAbi)
        this.nyanEthLpContract = new Contract(contracts.nyanEthLp, sushiPairAbi)
    }

    async getReserves() {
        const token0Call = this.nyanEthLpContract.token0()
        const token1Call = this.nyanEthLpContract.token1()
        const reservesCall = this.nyanEthLpContract.getReserves()
        const [ token0, token1, { _reserve0, _reserve1, _blockTimestampLast } ] = await this.ethcallProvider.all([
            token0Call, token1Call, reservesCall
        ])
        if (token0 === contracts.weth && token1 === contracts.nyanToken) {
            return { weth: _reserve0, nyan: _reserve1, blockNumber: _blockTimestampLast }
        } else if (token1 === contracts.weth && token0 === contracts.nyanToken) {
            return { weth: _reserve1, nyan: _reserve0, blockNumber: _blockTimestampLast }
        }
    }

    async getStakingInfo(account) {
        // balances
        const ethBalanceCall = this.ethcallProvider.getEthBalance(account)
        const nyanBalanceCall = this.nyanTokenContract.balanceOf(account)

        // staking balances
        const ethStakingBalanceCall = this.ethRewardsContract.balanceOf(account)
        const nyanEthStakingBalanceCall = this.nyanEthRewardsContract.balanceOf(account)
        const nyanStakingBalanceCall = this.nyanRewardsContract.balanceOf(account)

        // claimable rewards
        const ethStakingEarnedCall = this.ethRewardsContract.earned(account)
        const nyanEthStakingEarnedCall = this.nyanEthRewardsContract.earned(account)
        const nyanStakingEarnedCall = this.nyanRewardsContract.earned(account)

        const [
            ethBalance,
            nyanBalance,
            ethStakingBalance,
            nyanEthStakingBalance,
            nyanStakingBalance,
            ethStakingEarned,
            nyanEthStakingEarned,
            nyanStakingEarned
        ] = await this.ethcallProvider.all(
            [
                ethBalanceCall,
                nyanBalanceCall,
                ethStakingBalanceCall,
                nyanEthStakingBalanceCall,
                nyanStakingBalanceCall,
                ethStakingEarnedCall,
                nyanEthStakingEarnedCall,
                nyanStakingEarnedCall
            ]
        )
        return {
            ethBalance,
            nyanBalance,
            ethStakingBalance,
            nyanEthStakingBalance,
            nyanStakingBalance,
            ethStakingEarned,
            nyanEthStakingEarned,
            nyanStakingEarned
        }
    }
}


module.exports = {
    delay,
    NyanBot,
}
