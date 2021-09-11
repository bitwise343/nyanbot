require('dotenv').config()
const ethers = require('ethers')

const { delay, NyanBot } = require('./utils')

// can probably fold these into a single config file
const contracts = require('../abis/contractAddresses')
const multicallAbi = require('../abis/multicall')
const ethRewardsAbi = require('../abis/ethRewards')
const nyanRewardsAbi = require('../abis/nyanRewards')
const nyanEthRewardsAbi = require('../abis/nyanEthRewards')
const nyanTokenAbi = require('../abis/nyanToken')
const sushiRouterAbi = require('../abis/uniswapRouterV2')
const sushiPairAbi = require('../abis/uniswapV2Pair')

const { ARB_ONE_URL, PRIVATE_KEY } = process.env

const provider = new ethers.providers.JsonRpcProvider(ARB_ONE_URL)

// nyan & staking pools
const nyanToken = new ethers.Contract(contracts.nyanToken, nyanTokenAbi, provider)
const nyanRewards = new ethers.Contract(contracts.nyanRewards, nyanRewardsAbi, provider)
const ethRewards = new ethers.Contract(contracts.ethRewards, ethRewardsAbi, provider)
const nyanEthRewards = new ethers.Contract(contracts.ethRewards, nyanEthRewardsAbi, provider)
// sushiswap
const sushiRouter = new ethers.Contract(contracts.sushiRouter, sushiRouterAbi, provider)
const sushiPair = new ethers.Contract(contracts.nyanEthLp, sushiPairAbi, provider)

// keys & acct
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
const account = wallet.address

// watcher
const nyanBot = new NyanBot(provider)


const compoundNyanStaking = async (
    counter
) => {
    let {
        ethBalance,
        nyanBalance,
        ethStakingBalance,
        nyanEthStakingBalance,
        nyanStakingBalance,
        ethStakingEarned,
        nyanEthStakingEarned,
        nyanStakingEarned
    } = await nyanBot.getStakingInfo(account)

    // const gasPrice = await provider.getGasPrice()
    // const minBalance = new ethers.BigNumber.from((0.1 * 1e18).toString())
    // if (ethBalance.lt(minBalance)) {
    //     const { weth, nyan, blockNumber } = await nyanBot.getReserves()
    //     const gasPadding = gasPrice.mul(new ethers.BigNumber.from(minimumGas))
    //     const amountOut = minBalance.add(gasPadding)
    //     const amountIn = await sushiRouter.getAmountIn(amountOut, nyan, weth)
    //
    //     console.log('rebalancing gas')
    //     const swap = await sushiRouter.connect(wallet).swapTokensForExactEth(
    //         amountOut,
    //         amountIn.mul(new ethers.BigNumber.from((1 + slippage).toString())),
    //         [contracts.nyanToken, contracts.weth],
    //         account,
    //         blockNumber.add(new ethers.BigNumber.from("50"))
    //     )
    // }

    if (nyanStakingEarned.gt(new ethers.BigNumber.from((50*1e18).toString()))) {
        console.log('claiming NYAN staking rewards. . .')
        const claim = await nyanRewards.connect(wallet).getReward()
        console.log(`https://arbiscan.io/tx/${claim.hash}`)

        if (!(counter % 4)) {
            console.log('rebalancing gas')
            const { weth, nyan, blockNumber } = await nyanBot.getReserves()
            const amountIn = nyanStakingEarned.div(new ethers.BigNumber.from('2'))
            const amountOut = await sushiRouter.getAmountOut(amountIn, nyan, weth)

            const slippage = amountOut
                .mul(new ethers.BigNumber.from('10'))
                .div(new ethers.BigNumber.from('1000'))

            const swap = await sushiRouter.connect(wallet).swapExactTokensForETH(
                amountIn,
                amountOut.sub(slippage),
                [contracts.nyanToken, contracts.weth],
                account,
                (new ethers.BigNumber.from(blockNumber)).add(new ethers.BigNumber.from("50"))
            )
            console.log(`https://arbiscan.io/tx/${swap.hash}`)
        }

        console.log('staking NYAN rewards. . .')
        await delay(30000)

        const balance = await nyanToken.balanceOf(account)
        const stake = await nyanRewards.connect(wallet).stake(balance)
        console.log(`https://arbiscan.io/tx/${stake.hash}`)
    } else {
        console.log('minimum not earned yet')
    }

    let info = await nyanBot.getStakingInfo(account)

    console.log(`eth balance: ${(info.ethBalance/1e18).toString()} ETH`)
    console.log(`nyan balance: ${(info.nyanBalance/1e18).toString()} NYAN`)

    console.log(`eth staking balance: ${(info.ethStakingBalance/1e18).toString()} ETH`)
    console.log(`nyan staking balance: ${(info.nyanStakingBalance/1e18).toString()} NYAN`)
    console.log(`slp staking balance: ${(info.nyanEthStakingBalance/1e18).toString()} SLP`)

    console.log(`eth staking earned: ${(info.ethStakingEarned/1e18).toString()} NYAN`)
    console.log(`nyan staking earned: ${(info.nyanStakingEarned/1e18).toString()} NYAN`)
    console.log(`slp staking earned: ${(info.nyanEthStakingEarned/1e18).toString()} NYAN`)
}


const main = async () => {
    const interval = 3600000 / 4 // 1 hour / 4 == 15 minutes
    let counter = 4
    const slippage = 0.01
    while (true) {
        try {
            await compoundNyanStaking(counter)
            console.log(`sleeping for: ${interval/3600000} hrs`)
            await delay(interval)
            counter += 1
        } catch (err) {
            console.error(err)
            process.exit()
        }
    }
}

main()
